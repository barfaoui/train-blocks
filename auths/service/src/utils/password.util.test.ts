import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.util';

describe('hashPassword', () => {
  it('returns a bcrypt hash different from the plaintext', async () => {
    const hashed = await hashPassword('secret-password');

    expect(hashed).not.toBe('secret-password');
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('produces different hashes for the same password', async () => {
    const first = await hashPassword('secret-password');
    const second = await hashPassword('secret-password');

    expect(first).not.toBe(second);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hashed = await hashPassword('secret-password');

    await expect(verifyPassword('secret-password', hashed)).resolves.toBe(true);
  });

  it('returns false for the wrong password', async () => {
    const hashed = await hashPassword('secret-password');

    await expect(verifyPassword('wrong-password', hashed)).resolves.toBe(false);
  });
});
