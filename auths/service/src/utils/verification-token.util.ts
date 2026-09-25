import { createHash, randomBytes } from 'node:crypto';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

// 32 random bytes are 43 base64url characters; `verifyEmailBody` checks that length.
export function generateVerificationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashVerificationToken(token) };
}

// A plain sha256 is enough here (unlike passwords): the token is high-entropy, so there
// is nothing to brute-force, and the hash has to be deterministic to look the token up.
export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
