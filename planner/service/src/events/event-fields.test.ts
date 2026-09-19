import { describe, expect, it } from 'vitest';

import { SPORT_TYPES } from '@common/planner-types';

import { parseEventFields } from './event-fields';

const validBody = {
  title: '  Morning Run  ',
  startDate: '2026-09-15',
  endDate: '2026-09-15',
  timezone: 'Europe/Paris',
  sportType: 'OUTSIDE_RUNNING',
};

function errorFor(overrides: Record<string, unknown>): string | undefined {
  const result = parseEventFields({ ...validBody, ...overrides });
  return 'error' in result ? result.error : undefined;
}

describe('parseEventFields', () => {
  it('trims the title and defaults the optional fields to null', () => {
    const result = parseEventFields(validBody);

    expect(result).toEqual({
      value: {
        title: 'Morning Run',
        startDate: '2026-09-15',
        endDate: '2026-09-15',
        startTime: null,
        endTime: null,
        timezone: 'Europe/Paris',
        sportType: 'OUTSIDE_RUNNING',
        description: null,
        location: null,
      },
    });
  });

  it('keeps the optional fields that are provided', () => {
    const result = parseEventFields({
      ...validBody,
      startTime: '08:00:00',
      endTime: '09:00:00',
      description: 'Easy pace',
      location: 'Park',
    });

    expect(result).toMatchObject({
      value: {
        startTime: '08:00:00',
        endTime: '09:00:00',
        description: 'Easy pace',
        location: 'Park',
      },
    });
  });

  it.each([
    ['a blank title', { title: '   ' }, 'title is required'],
    [
      'an invalid start date',
      { startDate: '2026-02-30' },
      'startDate must be a valid ISO date (YYYY-MM-DD)',
    ],
    [
      'an end date before the start date',
      { endDate: '2026-09-14' },
      'startDate must be before or equal to endDate',
    ],
    ['an invalid time', { startTime: '25:00:00' }, 'startTime must be a valid time (HH:mm:ss)'],
    [
      'an end time before the start time on a single day',
      { startTime: '10:00:00', endTime: '09:00:00' },
      'startTime must be before or equal to endTime on a single-day event',
    ],
    [
      'an unknown time zone',
      { timezone: 'Mars/Olympus' },
      'timezone must be a valid IANA time zone name',
    ],
    [
      'a missing sport type',
      { sportType: undefined },
      `sportType must be one of ${SPORT_TYPES.join(', ')}`,
    ],
    ['a non-string description', { description: 42 }, 'description must be a string'],
  ])('rejects %s', (_label, overrides, message) => {
    expect(errorFor(overrides)).toBe(message);
  });

  it('allows an earlier end time when the event spans several days', () => {
    expect(
      errorFor({ endDate: '2026-09-16', startTime: '10:00:00', endTime: '09:00:00' }),
    ).toBeUndefined();
  });
});
