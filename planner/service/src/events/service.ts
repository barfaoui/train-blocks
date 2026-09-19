import { randomUUID } from 'node:crypto';

import type { PlannerEvent } from '@common/planner-types';

import { Prisma } from '../../generated/client';
import { prisma } from '../data/prisma';
import { EventNotFoundError, PlanNotFoundError } from '../data/types/errors';
import type {
  CreateEventInput,
  CreateEventResult,
  ListEventsFilters,
  UpdateEventInput,
  UpdateEventResult,
} from '../data/types/events';
import { addDaysToIsoDate, toIsoDateString, toIsoTimeString } from '../utils/date.util';
import { expandRecurrence } from '../utils/recurrence.util';

const WITH_SERIES_RULE = { series: { select: { recurrenceRule: true } } };

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
    include: WITH_SERIES_RULE,
    orderBy: { startDate: 'asc' },
  });

  return events.map((event) => toPlannerEvent(event));
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

  return {
    events: rows.map((row) => toPlannerEvent({ ...row, recurrenceRule: input.recurrenceRule })),
    truncated,
  };
}

export async function updateEvent(
  userId: string,
  eventId: string,
  input: UpdateEventInput,
): Promise<UpdateEventResult> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null, createdById: userId },
  });
  if (!existing) {
    throw new EventNotFoundError();
  }

  const durationDays = Math.round(
    (Date.parse(`${input.endDate}T00:00:00Z`) - Date.parse(`${input.startDate}T00:00:00Z`)) /
      MS_PER_DAY,
  );

  const sharedFields = {
    title: input.title,
    startTime: input.startTime ? new Date(`1970-01-01T${input.startTime}Z`) : null,
    endTime: input.endTime ? new Date(`1970-01-01T${input.endTime}Z`) : null,
    timezone: input.timezone,
    description: input.description,
    location: input.location,
    sportType: input.sportType,
  };

  const deltaDays = Math.round(
    (Date.parse(`${input.startDate}T00:00:00Z`) -
      Date.parse(`${toIsoDateString(existing.startDate)}T00:00:00Z`)) /
      MS_PER_DAY,
  );

  // "This and future" = the edited occurrence and every later one. A one-off falls
  // back to its own id so the filter can't match unrelated one-off events.
  const rootId = existing.seriesId ?? existing.id;
  const fromThisOn = { seriesId: rootId, deletedAt: null, startDate: { gte: existing.startDate } };

  // A recurrence change never applies to a single occurrence.
  const changesRecurrence =
    input.recurrenceRule !== undefined &&
    (existing.seriesId ? input.scope === 'THIS_AND_FUTURE_EVENTS' : input.recurrenceRule !== null);

  if (changesRecurrence) {
    const recurrenceRule = input.recurrenceRule as string | null;

    // Keep the edited occurrence; replace the later ones with a fresh expansion.
    const { occurrenceDates, truncated } =
      recurrenceRule === null
        ? { occurrenceDates: [input.startDate], truncated: false }
        : expandRecurrence(recurrenceRule, input.startDate);

    const newRows = occurrenceDates.slice(1).map((occDate) => ({
      id: randomUUID(),
      ...sharedFields,
      startDate: new Date(`${occDate}T00:00:00Z`),
      endDate: new Date(`${addDaysToIsoDate(occDate, durationDays)}T00:00:00Z`),
      createdById: existing.createdById,
      planId: existing.planId,
      recurrenceRule: null,
      seriesId: recurrenceRule === null ? null : rootId,
    }));

    // The root stores the rule, so write it there when editing a later occurrence.
    const isRoot = existing.id === rootId;
    const rootRuleUpdate =
      !isRoot && recurrenceRule !== null
        ? [prisma.event.update({ where: { id: rootId }, data: { recurrenceRule } })]
        : [];

    // Replaced occurrences are soft-deleted; participants/reminders don't carry over.
    const [, updatedExisting] = await prisma.$transaction([
      prisma.event.updateMany({
        where: { ...fromThisOn, id: { notIn: [rootId, existing.id] } },
        data: { deletedAt: new Date() },
      }),
      prisma.event.update({
        where: { id: existing.id },
        data: {
          ...sharedFields,
          startDate: new Date(`${input.startDate}T00:00:00Z`),
          endDate: new Date(`${addDaysToIsoDate(input.startDate, durationDays)}T00:00:00Z`),
          ...(isRoot ? { recurrenceRule } : {}),
          seriesId: recurrenceRule === null ? null : rootId,
        },
        include: WITH_SERIES_RULE,
      }),
      prisma.event.createMany({ data: newRows }),
      ...rootRuleUpdate,
    ]);

    return {
      events: [
        toPlannerEvent(updatedExisting),
        ...newRows.map((row) => toPlannerEvent({ ...row, recurrenceRule })),
      ],
      truncated,
    };
  }

  if (input.scope === 'THIS_EVENT' || !existing.seriesId) {
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...sharedFields,
        startDate: new Date(`${input.startDate}T00:00:00Z`),
        endDate: new Date(`${addDaysToIsoDate(input.startDate, durationDays)}T00:00:00Z`),
      },
      include: WITH_SERIES_RULE,
    });
    return { events: [toPlannerEvent(updated)], truncated: false };
  }

  // Shift each affected occurrence by the days the edited one moved.
  const seriesEvents = await prisma.event.findMany({ where: fromThisOn });

  const updated = await prisma.$transaction(
    seriesEvents.map((event) => {
      const newStartDate = addDaysToIsoDate(toIsoDateString(event.startDate), deltaDays);
      const newEndDate = addDaysToIsoDate(newStartDate, durationDays);
      return prisma.event.update({
        where: { id: event.id },
        data: {
          ...sharedFields,
          startDate: new Date(`${newStartDate}T00:00:00Z`),
          endDate: new Date(`${newEndDate}T00:00:00Z`),
        },
        include: WITH_SERIES_RULE,
      });
    }),
  );

  return { events: updated.map((event) => toPlannerEvent(event)), truncated: false };
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
  recurrenceRule?: string | null;
  // Only the root stores the rule; occurrences read it through the series relation.
  series?: { recurrenceRule: string | null } | null;
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
    recurrenceRule: event.series?.recurrenceRule ?? event.recurrenceRule ?? null,
    planId: event.planId,
  };
}
