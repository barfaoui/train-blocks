import { describe, expect, it } from 'vitest';

import { toIsoTimeString } from './date.util';

describe('toIsoTimeString', () => {
  it('formats a time value as HH:mm:ss', () => {
    expect(toIsoTimeString(new Date('1970-01-01T07:30:00.000Z'))).toBe('07:30:00');
  });

  it('returns null for a null time', () => {
    expect(toIsoTimeString(null)).toBeNull();
  });
});
