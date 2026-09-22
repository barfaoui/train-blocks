import { describe, expect, it } from 'vitest';

import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './error-message.util';

class CustomApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomApiError';
  }
}

describe('getErrorMessage', () => {
  it('returns the message of an Error', () => {
    expect(getErrorMessage(new Error('Failed to save event'))).toBe('Failed to save event');
  });

  it('returns the message of an Error subclass', () => {
    expect(getErrorMessage(new CustomApiError('Invalid credentials'))).toBe('Invalid credentials');
  });

  it('falls back for an Error with an empty message', () => {
    expect(getErrorMessage(new Error(''))).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('returns a non-empty string as-is', () => {
    expect(getErrorMessage('Network unreachable')).toBe('Network unreachable');
  });

  it('falls back for an empty string', () => {
    expect(getErrorMessage('')).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('returns the message of a duck-typed object', () => {
    expect(getErrorMessage({ message: 'Something broke' })).toBe('Something broke');
  });

  it.each([null, undefined, 42, {}, { message: 42 }, { message: '' }])(
    'falls back for %p',
    (value) => {
      expect(getErrorMessage(value)).toBe(DEFAULT_ERROR_MESSAGE);
    },
  );
});
