import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ACCESS_TOKEN_COOKIE_NAME } from '@common/auth-constants';
import { TOKEN_MAX_AGE_MS } from '@common/utils/jwt.util';

import { readAccessToken, setAuthCookie } from './cookie';

describe('setAuthCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets an httpOnly Lax cookie', () => {
    const res = { cookie: vi.fn() };

    setAuthCookie(res as unknown as Response, 'signed-token');

    expect(res.cookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE_NAME, 'signed-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: TOKEN_MAX_AGE_MS,
      path: '/',
    });
  });

  it('sets Secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = { cookie: vi.fn() };

    setAuthCookie(res as unknown as Response, 'signed-token');

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      'signed-token',
      expect.objectContaining({ secure: true }),
    );
  });
});

describe('readAccessToken', () => {
  it('reads the access token cookie', () => {
    const req = {
      headers: { cookie: `other=1; ${ACCESS_TOKEN_COOKIE_NAME}=cookie-token` },
    } as Request;

    expect(readAccessToken(req)).toBe('cookie-token');
  });

  it('ignores an Authorization Bearer header', () => {
    const req = {
      headers: { authorization: 'Bearer header-token' },
    } as Request;

    expect(readAccessToken(req)).toBeUndefined();
  });

  it('returns undefined when the cookie is missing', () => {
    const req = { headers: {} } as Request;

    expect(readAccessToken(req)).toBeUndefined();
  });
});
