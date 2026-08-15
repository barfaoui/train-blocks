import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '@common/utils/jwt.util';

import type { AuthenticatedRequest } from '../data/types/authentication';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
