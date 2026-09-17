import { describe, expect, it } from 'vitest';

import { MAX_RECURRENCE_OCCURRENCES, expandRecurrence } from './recurrence.util';
import { InvalidRecurrenceRuleError } from '../data/types/errors';

describe('expandRecurrence', () => {
  it('expands a weekly rule with COUNT anchored on a matching weekday', () => {
    const result = expandRecurrence('FREQ=WEEKLY;BYDAY=TU;COUNT=6', '2026-09-15');

    expect(result).toEqual({
      occurrenceDates: [
        '2026-09-15',
        '2026-09-22',
        '2026-09-29',
        '2026-10-06',
        '2026-10-13',
        '2026-10-20',
      ],
      truncated: false,
    });
  });

  it('forces startDate to be the first occurrence even when the rule would not naturally produce it', () => {
    // 2026-09-16 is a Wednesday; BYDAY=TU would otherwise skip it.
    const result = expandRecurrence('FREQ=WEEKLY;BYDAY=TU;COUNT=3', '2026-09-16');

    expect(result.occurrenceDates[0]).toBe('2026-09-16');
    expect(result.truncated).toBe(false);
  });

  it('caps an unbounded rule at MAX_RECURRENCE_OCCURRENCES and reports truncation', () => {
    const result = expandRecurrence('FREQ=DAILY', '2026-09-15');

    expect(result.occurrenceDates).toHaveLength(MAX_RECURRENCE_OCCURRENCES);
    expect(result.occurrenceDates[0]).toBe('2026-09-15');
    expect(result.truncated).toBe(true);
  });

  it('caps a rule even when its own COUNT is far above the cap', () => {
    const result = expandRecurrence('FREQ=WEEKLY;COUNT=1000', '2026-09-16');

    expect(result.occurrenceDates).toHaveLength(MAX_RECURRENCE_OCCURRENCES);
    expect(result.truncated).toBe(true);
  });

  it('rejects a disallowed sub-daily frequency', () => {
    expect(() => expandRecurrence('FREQ=SECONDLY;COUNT=5', '2026-09-15')).toThrow(
      InvalidRecurrenceRuleError,
    );
  });

  it('rejects a string with no FREQ token', () => {
    expect(() => expandRecurrence('garbage', '2026-09-15')).toThrow(InvalidRecurrenceRuleError);
  });
});
