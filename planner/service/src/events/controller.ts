import { Router } from 'express';

import type { AuthenticatedRequest } from '@common/auth-types';
import type { SportType } from '@common/planner-types';
import { requireAuth } from '@common/utils/auth-middleware.util';

import { createEvent, listEvents, updateEvent } from './service';
import {
  EventNotFoundError,
  InvalidRecurrenceRuleError,
  PlanNotFoundError,
} from '../data/types/errors';
import type { EventEditScope } from '../data/types/events';
import { isValidIsoDate, isValidIsoTime } from '../utils/date.util';

const SPORT_TYPES: SportType[] = ['RUNNING', 'CYCLING', 'SWIMMING', 'STRENGTH', 'YOGA', 'OTHER'];
const EVENT_EDIT_SCOPES: EventEditScope[] = ['THIS_EVENT', 'ALL_EVENTS'];
const TITLE_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 255;
const TIMEZONE_MAX_LENGTH = 64;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ParsedEventFields = {
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
function parseEventFields(
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

export const eventsRouter = Router();

eventsRouter.get('/', requireAuth, async (req, res) => {
  const { startDate, endDate, sportType } = req.query;

  if (typeof startDate !== 'string' || !isValidIsoDate(startDate)) {
    res.status(400).json({ error: 'startDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }
  if (typeof endDate !== 'string' || !isValidIsoDate(endDate)) {
    res.status(400).json({ error: 'endDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }
  if (startDate > endDate) {
    res.status(400).json({ error: 'startDate must be before or equal to endDate' });
    return;
  }

  let sportTypes: SportType[] | undefined;
  if (sportType !== undefined) {
    const values = Array.isArray(sportType) ? sportType : [sportType];
    const isValid = values.every(
      (value) => typeof value === 'string' && SPORT_TYPES.includes(value as SportType),
    );
    if (!isValid) {
      res.status(400).json({ error: `sportType must be one of ${SPORT_TYPES.join(', ')}` });
      return;
    }
    sportTypes = values as SportType[];
  }

  const { user } = req as AuthenticatedRequest;

  try {
    const events = await listEvents(user.id, { startDate, endDate, sportTypes });
    res.status(200).json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

eventsRouter.post('/', requireAuth, async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const parsed = parseEventFields(body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  let planId: string | null = null;
  if (body.planId !== undefined && body.planId !== null) {
    if (typeof body.planId !== 'string' || !UUID_PATTERN.test(body.planId)) {
      res.status(400).json({ error: 'planId must be a valid UUID' });
      return;
    }
    planId = body.planId;
  }

  let recurrenceRule: string | null = null;
  if (body.recurrenceRule !== undefined && body.recurrenceRule !== null) {
    if (typeof body.recurrenceRule !== 'string' || body.recurrenceRule.trim().length === 0) {
      res.status(400).json({ error: 'recurrenceRule must be a non-empty string' });
      return;
    }
    recurrenceRule = body.recurrenceRule;
  }

  const { user } = req as AuthenticatedRequest;

  try {
    const result = await createEvent(user.id, {
      ...parsed.value,
      planId,
      recurrenceRule,
    });
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof InvalidRecurrenceRuleError || error instanceof PlanNotFoundError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

eventsRouter.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    res.status(400).json({ error: 'id must be a valid UUID' });
    return;
  }

  const body = req.body as Record<string, unknown>;

  const parsed = parseEventFields(body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  if (typeof body.scope !== 'string' || !EVENT_EDIT_SCOPES.includes(body.scope as EventEditScope)) {
    res.status(400).json({ error: `scope must be one of ${EVENT_EDIT_SCOPES.join(', ')}` });
    return;
  }

  // Absent keeps the current recurrence; null removes it.
  let recurrenceRule: string | null | undefined;
  if (body.recurrenceRule !== undefined) {
    if (
      body.recurrenceRule !== null &&
      (typeof body.recurrenceRule !== 'string' || body.recurrenceRule.trim().length === 0)
    ) {
      res.status(400).json({ error: 'recurrenceRule must be a non-empty string or null' });
      return;
    }
    recurrenceRule = body.recurrenceRule;
  }

  const { user } = req as AuthenticatedRequest;

  try {
    const result = await updateEvent(user.id, id, {
      ...parsed.value,
      recurrenceRule,
      scope: body.scope as EventEditScope,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidRecurrenceRuleError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
