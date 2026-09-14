import { describe, expect, it } from 'vitest';

import { isValidIsoDate, toIsoTimeString } from './date.util';

describe('toIsoTimeString', () => {
  it('formats a time value as HH:mm:ss', () => {
    expect(toIsoTimeString(new Date('1970-01-01T07:30:00.000Z'))).toBe('07:30:00');
  });

  it('returns null for a null time', () => {
    expect(toIsoTimeString(null)).toBeNull();
  });
});

describe('isValidIsoDate', () => {
  it('accepts a valid calendar date', () => {
    expect(isValidIsoDate('2026-09-14')).toBe(true);
  });

  it('accepts a leap day in a leap year', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
  });

  it('rejects a non-existent day for the month', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
  });

  it('rejects a leap day in a non-leap year', () => {
    expect(isValidIsoDate('2023-02-29')).toBe(false);
  });

  it('rejects an out-of-range month', () => {
    expect(isValidIsoDate('2026-13-01')).toBe(false);
  });

  it('rejects a value that is not in YYYY-MM-DD format', () => {
    expect(isValidIsoDate('09/14/2026')).toBe(false);
  });
});
