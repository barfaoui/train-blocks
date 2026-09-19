import type { SportType } from '@common/planner-types';

import { isValidIsoDate, isValidIsoTime } from '../utils/date.util';

export const SPORT_TYPES: SportType[] = [
  'RUNNING',
  'CYCLING',
  'SWIMMING',
  'STRENGTH',
  'YOGA',
  'OTHER',
];
const TITLE_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 255;
const TIMEZONE_MAX_LENGTH = 64;

export type ParsedEventFields = {
  title: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  sportType: SportType;
  description: string | null;
  location: string | null;
};

// Shared by create and update: both accept the same core event fields and
// apply the same validation rules to them.
export function parseEventFields(
  body: Record<string, unknown>,
): { error: string } | { value: ParsedEventFields } {
  if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    return { error: 'title is required' };
  }
  const title = body.title.trim();
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` };
  }

  if (typeof body.startDate !== 'string' || !isValidIsoDate(body.startDate)) {
    return { error: 'startDate must be a valid ISO date (YYYY-MM-DD)' };
  }
  if (typeof body.endDate !== 'string' || !isValidIsoDate(body.endDate)) {
    return { error: 'endDate must be a valid ISO date (YYYY-MM-DD)' };
  }
  if (body.startDate > body.endDate) {
    return { error: 'startDate must be before or equal to endDate' };
  }

  let startTime: string | null = null;
  if (body.startTime !== undefined && body.startTime !== null) {
    if (typeof body.startTime !== 'string' || !isValidIsoTime(body.startTime)) {
      return { error: 'startTime must be a valid time (HH:mm:ss)' };
    }
    startTime = body.startTime;
  }

  let endTime: string | null = null;
  if (body.endTime !== undefined && body.endTime !== null) {
    if (typeof body.endTime !== 'string' || !isValidIsoTime(body.endTime)) {
      return { error: 'endTime must be a valid time (HH:mm:ss)' };
    }
    endTime = body.endTime;
  }

  if (
    body.startDate === body.endDate &&
    startTime !== null &&
    endTime !== null &&
    startTime > endTime
  ) {
    return { error: 'startTime must be before or equal to endTime on a single-day event' };
  }

  if (typeof body.timezone !== 'string' || body.timezone.trim().length === 0) {
    return { error: 'timezone is required' };
  }
  if (body.timezone.length > TIMEZONE_MAX_LENGTH) {
    return { error: `timezone must be ${TIMEZONE_MAX_LENGTH} characters or fewer` };
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
  } catch {
    return { error: 'timezone must be a valid IANA time zone name' };
  }

  if (typeof body.sportType !== 'string' || !SPORT_TYPES.includes(body.sportType as SportType)) {
    return { error: `sportType must be one of ${SPORT_TYPES.join(', ')}` };
  }

  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return { error: 'description must be a string' };
    }
    description = body.description;
  }

  let location: string | null = null;
  if (body.location !== undefined && body.location !== null) {
    if (typeof body.location !== 'string' || body.location.length > LOCATION_MAX_LENGTH) {
      return { error: `location must be a string of ${LOCATION_MAX_LENGTH} characters or fewer` };
    }
    location = body.location;
  }

  return {
    value: {
      title,
      startDate: body.startDate,
      endDate: body.endDate,
      startTime,
      endTime,
      timezone: body.timezone,
      sportType: body.sportType as SportType,
      description,
      location,
    },
  };
}
