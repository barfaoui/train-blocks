import jwt from 'jsonwebtoken';

export type TokenPayload = {
  sub: string;
  username: string;
};

// `issuedAt` is the JWT's `iat`, in seconds since the epoch.
export type VerifiedToken = TokenPayload & { issuedAt: number };

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

export function verifyToken(token: string): VerifiedToken {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!isTokenPayload(decoded) || typeof (decoded as jwt.JwtPayload).iat !== 'number') {
    throw new Error('Invalid token payload');
  }

  return {
    sub: decoded.sub,
    username: decoded.username,
    issuedAt: (decoded as jwt.JwtPayload).iat as number,
  };
}

// A session is only valid if it started after the last password change. `iat` has
// one-second precision, so a token issued in the same second as the change still counts:
// that's the new session handed out by the change itself.
export function isIssuedBeforePasswordChange(
  issuedAt: number,
  passwordChangedAt: Date | null,
): boolean {
  return passwordChangedAt !== null && issuedAt < Math.floor(passwordChangedAt.getTime() / 1000);
}
