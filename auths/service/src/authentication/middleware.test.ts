import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyToken } from '@common/utils/jwt.util';

import { requireAuth } from './middleware';
import type { AuthenticatedRequest } from '../data/types/authentication';

vi.mock('@common/utils/jwt.util', () => ({
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

function createMockReq(authorization?: string): Request {
  return {
    headers: !authorization ? {} : { authorization },
  } as Request;
}

describe('requireAuth', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('returns 401 when the Authorization header is missing', () => {
    const req = createMockReq();
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the scheme is not Bearer', () => {
    const req = createMockReq('Basic abc123');
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the Bearer token is empty', () => {
    const req = createMockReq('Bearer ');
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

    const req = createMockReq('Bearer bad-token');
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user from the token payload and calls next', () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra' });

    const req = createMockReq('Bearer valid-token');
    const res = createMockRes();

    requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('valid-token');
    expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', username: 'bochra' });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
