import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedRequest } from '../auth-types';
import { requireAuth } from './auth-middleware.util';
import { verifyToken } from './jwt.util';

const ACCESS_TOKEN_COOKIE_NAME = 'jwt';

vi.mock('./jwt.util', () => ({
  verifyToken: vi.fn(),
}));

const verifyTokenMock = vi.mocked(verifyToken);

function createMockRes(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response;
}

function createMockReq(cookie?: string): Request {
  return {
    headers: cookie ? { cookie } : {},
  } as Request;
}

describe('requireAuth', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('returns 401 when the access token cookie is missing', () => {
    const req = createMockReq();
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when verifyToken throws', () => {
    verifyTokenMock.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=bad-token`);
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user from the access token cookie and calls next', () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra' });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('cookie-token');
    expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', username: 'bochra' });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
