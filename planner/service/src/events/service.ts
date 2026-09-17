import { randomUUID } from 'node:crypto';

import type { PlannerEvent } from '@common/planner-types';

import { Prisma } from '../../generated/client';
import { prisma } from '../data/prisma';
import { PlanNotFoundError } from '../data/types/errors';
import type { CreateEventInput, CreateEventResult, ListEventsFilters } from '../data/types/events';
import { addDaysToIsoDate, toIsoDateString, toIsoTimeString } from '../utils/date.util';
import { expandRecurrence } from '../utils/recurrence.util';

export async function listEvents(
  userId: string,
  filters: ListEventsFilters,
): Promise<PlannerEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      startDate: { lte: new Date(filters.endDate) },
      endDate: { gte: new Date(filters.startDate) },
      ...(filters.sportTypes ? { sportType: { in: filters.sportTypes } } : {}),
      OR: [{ createdById: userId }, { participants: { some: { userId } } }],
    },
    orderBy: { startDate: 'asc' },
  });

  return events.map(toPlannerEvent);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function createEvent(
  userId: string,
  input: CreateEventInput,
): Promise<CreateEventResult> {
  const durationDays = Math.round(
    (Date.parse(`${input.endDate}T00:00:00Z`) - Date.parse(`${input.startDate}T00:00:00Z`)) /
      MS_PER_DAY,
  );

  const isSeries = input.recurrenceRule !== null;
  let occurrenceDates = [input.startDate];
  let truncated = false;
  if (isSeries) {
    ({ occurrenceDates, truncated } = expandRecurrence(
      input.recurrenceRule as string,
      input.startDate,
    ));
  }

  const rootId = randomUUID();
  const rows = occurrenceDates.map((occDate, index) => ({
    id: index === 0 ? rootId : randomUUID(),
    title: input.title,
    startDate: new Date(`${occDate}T00:00:00Z`),
    endDate: new Date(`${addDaysToIsoDate(occDate, durationDays)}T00:00:00Z`),
    startTime: input.startTime ? new Date(`1970-01-01T${input.startTime}Z`) : null,
    endTime: input.endTime ? new Date(`1970-01-01T${input.endTime}Z`) : null,
    timezone: input.timezone,
    description: input.description,
    location: input.location,
    sportType: input.sportType,
    createdById: userId,
    planId: input.planId,
    recurrenceRule: index === 0 && isSeries ? input.recurrenceRule : null,
    seriesId: isSeries ? rootId : null,
  }));

  try {
    await prisma.event.createMany({ data: rows });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new PlanNotFoundError();
    }
    throw error;
  }

  return { events: rows.map(toPlannerEvent), truncated };
}

function toPlannerEvent(event: {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: Date | null;
  endTime: Date | null;
  timezone: string;
  sportType: string;
  description: string | null;
  location: string | null;
  seriesId: string | null;
  planId: string | null;
}): PlannerEvent {
  return {
    id: event.id,
    title: event.title,
    startDate: toIsoDateString(event.startDate),
    endDate: toIsoDateString(event.endDate),
    startTime: toIsoTimeString(event.startTime),
    endTime: toIsoTimeString(event.endTime),
    timezone: event.timezone,
    sportType: event.sportType as PlannerEvent['sportType'],
    description: event.description,
    location: event.location,
    seriesId: event.seriesId,
    planId: event.planId,
  };
}
