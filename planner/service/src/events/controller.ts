import { Router } from 'express';

import type { AuthenticatedRequest } from '@common/auth-types';
import type { SportType } from '@common/planner-types';
import { requireAuth } from '@common/utils/auth-middleware.util';

import { createEvent, listEvents } from './service';
import { InvalidRecurrenceRuleError, PlanNotFoundError } from '../data/types/errors';
import { isValidIsoDate, isValidIsoTime } from '../utils/date.util';

const SPORT_TYPES: SportType[] = ['RUNNING', 'CYCLING', 'SWIMMING', 'STRENGTH', 'YOGA', 'OTHER'];
const TITLE_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 255;
const TIMEZONE_MAX_LENGTH = 64;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const title = body.title.trim();
  if (title.length > TITLE_MAX_LENGTH) {
    res.status(400).json({ error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` });
    return;
  }

  if (typeof body.startDate !== 'string' || !isValidIsoDate(body.startDate)) {
    res.status(400).json({ error: 'startDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }
  if (typeof body.endDate !== 'string' || !isValidIsoDate(body.endDate)) {
    res.status(400).json({ error: 'endDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }
  if (body.startDate > body.endDate) {
    res.status(400).json({ error: 'startDate must be before or equal to endDate' });
    return;
  }

  let startTime: string | null = null;
  if (body.startTime !== undefined && body.startTime !== null) {
    if (typeof body.startTime !== 'string' || !isValidIsoTime(body.startTime)) {
      res.status(400).json({ error: 'startTime must be a valid time (HH:mm:ss)' });
      return;
    }
    startTime = body.startTime;
  }

  let endTime: string | null = null;
  if (body.endTime !== undefined && body.endTime !== null) {
    if (typeof body.endTime !== 'string' || !isValidIsoTime(body.endTime)) {
      res.status(400).json({ error: 'endTime must be a valid time (HH:mm:ss)' });
      return;
    }
    endTime = body.endTime;
  }

  if (
    body.startDate === body.endDate &&
    startTime !== null &&
    endTime !== null &&
    startTime > endTime
  ) {
    res
      .status(400)
      .json({ error: 'startTime must be before or equal to endTime on a single-day event' });
    return;
  }

  if (typeof body.timezone !== 'string' || body.timezone.trim().length === 0) {
    res.status(400).json({ error: 'timezone is required' });
    return;
  }
  if (body.timezone.length > TIMEZONE_MAX_LENGTH) {
    res.status(400).json({ error: `timezone must be ${TIMEZONE_MAX_LENGTH} characters or fewer` });
    return;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
  } catch {
    res.status(400).json({ error: 'timezone must be a valid IANA time zone name' });
    return;
  }

  if (typeof body.sportType !== 'string' || !SPORT_TYPES.includes(body.sportType as SportType)) {
    res.status(400).json({ error: `sportType must be one of ${SPORT_TYPES.join(', ')}` });
    return;
  }

  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      res.status(400).json({ error: 'description must be a string' });
      return;
    }
    description = body.description;
  }

  let location: string | null = null;
  if (body.location !== undefined && body.location !== null) {
    if (typeof body.location !== 'string' || body.location.length > LOCATION_MAX_LENGTH) {
      res
        .status(400)
        .json({ error: `location must be a string of ${LOCATION_MAX_LENGTH} characters or fewer` });
      return;
    }
    location = body.location;
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
      title,
      startDate: body.startDate,
      endDate: body.endDate,
      startTime,
      endTime,
      timezone: body.timezone,
      sportType: body.sportType as SportType,
      description,
      location,
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
