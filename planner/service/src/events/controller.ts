import { Router } from 'express';

import type { AuthenticatedRequest } from '@common/auth-types';
import type { SportType } from '@common/planner-types';
import { requireAuth } from '@common/utils/auth-middleware.util';

import { listEvents } from './service';

const SPORT_TYPES: SportType[] = ['RUNNING', 'CYCLING', 'SWIMMING', 'STRENGTH', 'YOGA', 'OTHER'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const eventsRouter = Router();

eventsRouter.get('/', requireAuth, async (req, res) => {
  const { startDate, endDate, sportType } = req.query;

  if (typeof startDate !== 'string' || !ISO_DATE_PATTERN.test(startDate)) {
    res.status(400).json({ error: 'startDate must be an ISO date (YYYY-MM-DD)' });
    return;
  }
  if (typeof endDate !== 'string' || !ISO_DATE_PATTERN.test(endDate)) {
    res.status(400).json({ error: 'endDate must be an ISO date (YYYY-MM-DD)' });
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
