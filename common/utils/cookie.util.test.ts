import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAuthCookie, readAccessToken, setAuthCookie } from './cookie.util';
import { TOKEN_MAX_AGE_MS } from './jwt.util';

const ACCESS_TOKEN_COOKIE_NAME = 'jwt';

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

describe('clearAuthCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('clears the httpOnly Lax cookie', () => {
    const res = { clearCookie: vi.fn() };

    clearAuthCookie(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  });

  it('sets Secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = { clearCookie: vi.fn() };

    clearAuthCookie(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
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
