import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '@common/utils/jwt.util';

import { readAccessToken } from './cookie';
import type { AuthenticatedRequest } from '../data/types/authentication';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readAccessToken(req);
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
