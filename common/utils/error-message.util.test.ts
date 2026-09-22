import { describe, expect, it } from 'vitest';

import { DEFAULT_ERROR_MESSAGE, UserFacingError, getErrorMessage } from './error-message.util';

class CustomApiError extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = 'CustomApiError';
  }
}

describe('getErrorMessage', () => {
  it('returns the message of a UserFacingError', () => {
    expect(getErrorMessage(new UserFacingError('An event with this title already exists'))).toBe(
      'An event with this title already exists',
    );
  });

  it('returns the message of a UserFacingError subclass', () => {
    expect(getErrorMessage(new CustomApiError('Invalid credentials'))).toBe('Invalid credentials');
  });

  it('falls back for a UserFacingError with an empty message', () => {
    expect(getErrorMessage(new UserFacingError(''))).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('falls back for a plain Error, since its message is not meant for end users', () => {
    expect(getErrorMessage(new Error('Cannot read properties of undefined (reading "foo")'))).toBe(
      DEFAULT_ERROR_MESSAGE,
    );
  });

  it('falls back for a built-in Error subclass like TypeError', () => {
    expect(getErrorMessage(new TypeError('x is not a function'))).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('returns a non-empty string as-is', () => {
    expect(getErrorMessage('Network unreachable')).toBe('Network unreachable');
  });

  it('falls back for an empty string', () => {
    expect(getErrorMessage('')).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('falls back for a duck-typed object with a message property', () => {
    expect(getErrorMessage({ message: 'Something broke' })).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it.each([null, undefined, 42, {}, { message: 42 }, { message: '' }])(
    'falls back for %p',
    (value) => {
      expect(getErrorMessage(value)).toBe(DEFAULT_ERROR_MESSAGE);
    },
  );
});
