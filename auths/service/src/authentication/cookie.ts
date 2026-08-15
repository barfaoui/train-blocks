import type { Request, Response } from 'express';

import { TOKEN_MAX_AGE_MS } from '@common/utils/jwt.util';

const ACCESS_TOKEN_COOKIE_NAME = 'jwt';

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  });
}

export function readAccessToken(req: Request): string | undefined {
  return readCookie(req.headers.cookie, ACCESS_TOKEN_COOKIE_NAME);
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }

    return decodeURIComponent(trimmed.slice(separator + 1).trim());
  }

  return undefined;
}
