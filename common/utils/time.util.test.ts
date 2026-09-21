import { describe, expect, it } from 'vitest';

import { addMinutesToTime, formatHour, to12Hour, to24Hour } from './time.util';

describe('to12Hour', () => {
  it.each([
    [0, 12, 'AM'],
    [1, 1, 'AM'],
    [11, 11, 'AM'],
    [12, 12, 'PM'],
    [13, 1, 'PM'],
    [23, 11, 'PM'],
    [24, 12, 'AM'],
  ])('reads %i as %i %s', (hour24, hour, period) => {
    expect(to12Hour(hour24)).toEqual({ hour, period });
  });
});

describe('to24Hour', () => {
  it('converts morning and afternoon hours', () => {
    expect(to24Hour(6, 'AM')).toBe(6);
    expect(to24Hour(6, 'PM')).toBe(18);
    expect(to24Hour(12, 'PM')).toBe(12);
  });

  it('treats 12 AM as 0 for a start hour and 24 for an end hour', () => {
    expect(to24Hour(12, 'AM')).toBe(0);
    expect(to24Hour(12, 'AM', true)).toBe(24);
  });

  it('round-trips every hour', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const { hour: hour12, period } = to12Hour(hour);
      expect(to24Hour(hour12, period)).toBe(hour);
    }
  });
});

describe('formatHour', () => {
  it('formats a 24-hour clock', () => {
    expect(formatHour(6, false)).toBe('06:00');
    expect(formatHour(24, false)).toBe('24:00');
  });

  it('formats a 12-hour clock', () => {
    expect(formatHour(6, true)).toBe('6:00 AM');
    expect(formatHour(18, true)).toBe('6:00 PM');
    expect(formatHour(0, true)).toBe('12:00 AM');
  });
});

describe('addMinutesToTime', () => {
  it('adds minutes within the day', () => {
    expect(addMinutesToTime('09:30', 45)).toBe('10:15');
  });

  it('caps at 23:59 instead of rolling into the next day', () => {
    expect(addMinutesToTime('23:30', 60)).toBe('23:59');
  });
});
