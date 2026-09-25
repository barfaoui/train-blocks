import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth-types';
import { readAccessToken } from './cookie.util';
import { isIssuedBeforePasswordChange, verifyToken } from './jwt.util';

// The default `@prisma/client` location always resolves to the auths schema's generated
// client: the planner schema deliberately writes elsewhere so it doesn't overwrite it (see
// planner/service/prisma/schema.prisma). Both services connect to the same database, so this
// works from either one without a new dependency, and reuses one connection per process.
const prisma = new PrismaClient();

// Rejects a soft-deleted account the same way as a missing or expired token: a session
// from before the deletion (possibly on another device) stops working here, not just on
// its next `/me` refresh. Likewise for a session that started before the password was
// last changed or reset, which is how a password change signs out other devices.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, passwordChangedAt: true },
    });
    if (!user || isIssuedBeforePasswordChange(payload.issuedAt, user.passwordChangedAt)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  (req as AuthenticatedRequest).user = { id: payload.sub, username: payload.username };
  next();
}
