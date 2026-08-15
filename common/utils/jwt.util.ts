import jwt from 'jsonwebtoken';

export type TokenPayload = {
  sub: string;
  username: string;
};

export const TOKEN_EXPIRES_IN = '7d';
export const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.sub === 'string' && typeof payload.username === 'string';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!isTokenPayload(decoded)) {
    throw new Error('Invalid token payload');
  }

  return { sub: decoded.sub, username: decoded.username };
}
