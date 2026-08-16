import { describe, expect, it } from 'vitest';

import { confirmPassword, signUpForm } from './validation';

describe('confirmPassword', () => {
  it('accepts a value that matches the password', () => {
    expect(confirmPassword('Secret1!').parse('Secret1!')).toBe('Secret1!');
  });

  it('rejects an empty value', () => {
    const result = confirmPassword('Secret1!').safeParse('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Confirm your password');
    }
  });

  it('rejects a value that does not match the password', () => {
    const result = confirmPassword('Secret1!').safeParse('Secret2!');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Passwords do not match');
    }
  });
});

describe('signUpForm', () => {
  it('accepts matching passwords and normalizes the username', () => {
    expect(
      signUpForm({ password: 'Secret1!' }).parse({
        username: 'Bochra',
        password: 'Secret1!',
        confirmPassword: 'Secret1!',
      }),
    ).toEqual({
      username: 'bochra',
      password: 'Secret1!',
      confirmPassword: 'Secret1!',
    });
  });

  it('rejects when confirm password is empty', () => {
    const result = signUpForm({ password: 'Secret1!' }).safeParse({
      username: 'bochra',
      password: 'Secret1!',
      confirmPassword: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects when passwords do not match', () => {
    const result = signUpForm({ password: 'Secret1!' }).safeParse({
      username: 'bochra',
      password: 'Secret1!',
      confirmPassword: 'Secret2!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Passwords do not match');
    }
  });
});
