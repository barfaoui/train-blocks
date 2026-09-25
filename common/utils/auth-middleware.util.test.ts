import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedRequest } from '../auth-types';
import { requireAuth } from './auth-middleware.util';
import { verifyToken } from './jwt.util';

const ACCESS_TOKEN_COOKIE_NAME = 'jwt';

vi.mock('./jwt.util', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./jwt.util')>()),
  verifyToken: vi.fn(),
}));

// 2026-09-25T10:00:00Z, in seconds.
const ISSUED_AT = 1_790_330_400;

// vi.mock is hoisted above regular top-level declarations, so the mock's state has to be
// created through vi.hoisted to be visible inside the factory below.
const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: findUniqueMock };
  },
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

  it('returns 401 when the access token cookie is missing', async () => {
    const req = createMockReq();
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect(verifyTokenMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('returns 401 when verifyToken throws', async () => {
    verifyTokenMock.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=bad-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next when the account is active', async () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra', issuedAt: ISSUED_AT });
    findUniqueMock.mockResolvedValue({ id: 'user-1', passwordChangedAt: null });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith('cookie-token');
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'user-1', deletedAt: null },
      select: { id: true, passwordChangedAt: true },
    });
    expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', username: 'bochra' });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 for a valid token whose account is soft-deleted or gone', async () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra', issuedAt: ISSUED_AT });
    findUniqueMock.mockResolvedValue(null);

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns 401 for a session that started before the last password change', async () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra', issuedAt: ISSUED_AT });
    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      passwordChangedAt: new Date((ISSUED_AT + 60) * 1000),
    });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps the session handed out in the same second as the password change', async () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra', issuedAt: ISSUED_AT });
    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      passwordChangedAt: new Date(ISSUED_AT * 1000 + 400),
    });

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 500 when the account lookup fails', async () => {
    verifyTokenMock.mockReturnValue({ sub: 'user-1', username: 'bochra', issuedAt: ISSUED_AT });
    findUniqueMock.mockRejectedValue(new Error('connection lost'));

    const req = createMockReq(`${ACCESS_TOKEN_COOKIE_NAME}=cookie-token`);
    const res = createMockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
