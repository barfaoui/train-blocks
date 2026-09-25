import { createHash, randomBytes } from 'node:crypto';

// Tokens for the links we email: verifying an address and resetting a password.
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
// Short-lived: a reset link is a way into the account.
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
// Minimum gap between two emails of the same kind to one account, so the endpoints that
// send them can't be used to flood an inbox.
export const SEND_COOLDOWN_MS = 60 * 1000;

// 32 random bytes are 43 base64url characters; the link token schemas check that length.
export function generateLinkToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashLinkToken(token) };
}

// A plain sha256 is enough here (unlike passwords): the token is high-entropy, so there
// is nothing to brute-force, and the hash has to be deterministic to look the token up.
export function hashLinkToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
