import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.util';

const PASSWORD = 'password-example';

describe('hashPassword', () => {
  it('returns a bcrypt hash different from the plaintext', async () => {
    const hashed = await hashPassword(PASSWORD);

    expect(hashed).not.toBe(PASSWORD);
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('produces different hashes for the same password', async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);

    expect(first).not.toBe(second);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hashed = await hashPassword(PASSWORD);

    await expect(verifyPassword(PASSWORD, hashed)).resolves.toBe(true);
  });

  it('returns false for the wrong password', async () => {
    const hashed = await hashPassword(PASSWORD);

    await expect(verifyPassword('another-password', hashed)).resolves.toBe(false);
  });
});
