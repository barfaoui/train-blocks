import { describe, expect, it } from 'vitest';

import { addDaysToIsoDate, isValidIsoDate, isValidIsoTime, toIsoTimeString } from './date.util';

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

describe('isValidIsoTime', () => {
  it('accepts a valid time with seconds', () => {
    expect(isValidIsoTime('18:30:00')).toBe(true);
  });

  it('rejects a time missing seconds', () => {
    expect(isValidIsoTime('18:30')).toBe(false);
  });

  it('rejects an out-of-range hour', () => {
    expect(isValidIsoTime('24:00:00')).toBe(false);
  });
});

describe('addDaysToIsoDate', () => {
  it('rolls over a month boundary', () => {
    expect(addDaysToIsoDate('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('is a no-op for zero days', () => {
    expect(addDaysToIsoDate('2026-09-14', 0)).toBe('2026-09-14');
  });
});
