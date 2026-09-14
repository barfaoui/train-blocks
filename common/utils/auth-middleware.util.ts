import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth-types';
import { readAccessToken } from './cookie.util';
import { verifyToken } from './jwt.util';

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
