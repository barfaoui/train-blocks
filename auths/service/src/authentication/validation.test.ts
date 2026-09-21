import { describe, expect, it } from 'vitest';

import { calendarPreferencesBody } from '@common/auth-validation';

import { formatZodError, password, signInBody, signUpBody, username } from './validation';

describe('username', () => {
  it('trims and lowercases a valid username', () => {
    expect(username.parse('  Bochra  ')).toBe('bochra');
  });

  it('rejects usernames shorter than 3 characters', () => {
    const result = username.safeParse('ab');

    expect(result.success).toBe(false);
  });

  it('rejects usernames longer than 32 characters', () => {
    const result = username.safeParse('a'.repeat(33));

    expect(result.success).toBe(false);
  });

  it('rejects usernames with characters other than letters, numbers, and underscores', () => {
    const result = username.safeParse('bochra-1');

    expect(result.success).toBe(false);
  });
});

describe('password', () => {
  const validPassword = 'Secret1!';

  it('accepts a password that meets every rule', () => {
    expect(password.parse(validPassword)).toBe(validPassword);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = password.safeParse('Sec1!');

    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a lowercase letter', () => {
    const result = password.safeParse('SECRET1!');

    expect(result.success).toBe(false);
  });

  it('rejects passwords missing an uppercase letter', () => {
    const result = password.safeParse('secret1!');

    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a number', () => {
    const result = password.safeParse('Secret!!');

    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a special character', () => {
    const result = password.safeParse('Secret12');

    expect(result.success).toBe(false);
  });
});

describe('signUpBody', () => {
  it('normalizes username and keeps the password', () => {
    expect(
      signUpBody.parse({
        username: 'Bochra',
        password: 'Secret1!',
      }),
    ).toEqual({
      username: 'bochra',
      password: 'Secret1!',
    });
  });
});

describe('signInBody', () => {
  it('normalizes username and keeps the password', () => {
    expect(
      signInBody.parse({
        username: 'Bochra',
        password: 'Secret1!',
      }),
    ).toEqual({
      username: 'bochra',
      password: 'Secret1!',
    });
  });

  it('rejects an empty password', () => {
    const result = signInBody.safeParse({
      username: 'bochra',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a weak password that would fail sign-up rules', () => {
    expect(
      signInBody.parse({
        username: 'bochra',
        password: 'weak',
      }),
    ).toEqual({
      username: 'bochra',
      password: 'weak',
    });
  });
});

describe('formatZodError', () => {
  function issuesFor(result: { success: boolean; error?: unknown }) {
    if (result.success) {
      throw new Error('expected validation to fail');
    }
    return formatZodError(result.error as Parameters<typeof formatZodError>[0]);
  }

  it('names the failing field', () => {
    const formatted = issuesFor(signInBody.safeParse({ username: 'ab', password: 'x' }));

    expect(formatted.details.map((detail) => detail.path)).toEqual(['username']);
  });

  it('labels an issue about the whole body as "body"', () => {
    const formatted = issuesFor(calendarPreferencesBody.safeParse({}));

    expect(formatted.details).toEqual([{ path: 'body', message: 'Nothing to update' }]);
  });

  it('uses the given name for a bare value', () => {
    const result = username.safeParse('ab');
    if (result.success) {
      throw new Error('expected validation to fail');
    }

    expect(formatZodError(result.error, 'username').details[0].path).toBe('username');
  });
});
