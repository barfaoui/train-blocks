import { Router } from 'express';

import type { AuthenticatedRequest } from '@common/auth-types';
import type { SportType } from '@common/planner-types';
import { requireAuth } from '@common/utils/auth-middleware.util';

import { SPORT_TYPES, parseEventFields } from './event-fields';
import { createEvent, deleteEvent, listEvents, updateEvent } from './service';
import {
  EventNotFoundError,
  InvalidRecurrenceRuleError,
  PlanNotFoundError,
} from '../data/types/errors';
import type { EventDeleteScope, EventEditScope } from '../data/types/events';
import { isValidIsoDate } from '../utils/date.util';

const EVENT_EDIT_SCOPES: EventEditScope[] = ['THIS_EVENT', 'THIS_AND_FUTURE_EVENTS'];
const EVENT_DELETE_SCOPES: EventDeleteScope[] = [
  'THIS_EVENT',
  'THIS_AND_FUTURE_EVENTS',
  'ALL_EVENTS',
];
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

eventsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    res.status(400).json({ error: 'id must be a valid UUID' });
    return;
  }

  const { scope } = req.query;
  if (typeof scope !== 'string' || !EVENT_DELETE_SCOPES.includes(scope as EventDeleteScope)) {
    res.status(400).json({ error: `scope must be one of ${EVENT_DELETE_SCOPES.join(', ')}` });
    return;
  }

  const { user } = req as AuthenticatedRequest;

  try {
    await deleteEvent(user.id, id, scope as EventDeleteScope);
    res.status(204).end();
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
