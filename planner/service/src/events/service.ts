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

  // Changing the recurrence only makes sense for the series as a whole (or to
  // turn a one-off event into a series), never for a single occurrence.
  const changesRecurrence =
    input.recurrenceRule !== undefined &&
    (existing.seriesId ? input.scope === 'ALL_EVENTS' : input.recurrenceRule !== null);

  if (changesRecurrence) {
    const recurrenceRule = input.recurrenceRule as string | null;
    const rootId = existing.seriesId ?? existing.id;
    const seriesRows = existing.seriesId
      ? await prisma.event.findMany({ where: { seriesId: rootId, deletedAt: null } })
      : [existing];
    const root = seriesRows.find((row) => row.id === rootId);
    if (!root) {
      throw new EventNotFoundError();
    }

    // Regenerate the series from the (possibly shifted) root date: the root row
    // is kept so the seriesId stays stable, other occurrences are soft-deleted
    // and replaced by freshly expanded ones.
    const rootStart = addDaysToIsoDate(toIsoDateString(root.startDate), deltaDays);
    const { occurrenceDates, truncated } =
      recurrenceRule === null
        ? { occurrenceDates: [rootStart], truncated: false }
        : expandRecurrence(recurrenceRule, rootStart);

    const newRows = occurrenceDates.slice(1).map((occDate) => ({
      id: randomUUID(),
      ...sharedFields,
      startDate: new Date(`${occDate}T00:00:00Z`),
      endDate: new Date(`${addDaysToIsoDate(occDate, durationDays)}T00:00:00Z`),
      createdById: root.createdById,
      planId: root.planId,
      recurrenceRule: null,
      seriesId: rootId,
    }));

    const [, updatedRoot] = await prisma.$transaction([
      prisma.event.updateMany({
        where: { seriesId: rootId, id: { not: rootId }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.event.update({
        where: { id: rootId },
        data: {
          ...sharedFields,
          startDate: new Date(`${rootStart}T00:00:00Z`),
          endDate: new Date(`${addDaysToIsoDate(rootStart, durationDays)}T00:00:00Z`),
          recurrenceRule,
          seriesId: recurrenceRule === null ? null : rootId,
        },
        include: WITH_SERIES_RULE,
      }),
      prisma.event.createMany({ data: newRows }),
    ]);

    return {
      events: [
        toPlannerEvent(updatedRoot),
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

  // Whole-series edit: shift every occurrence by the same number of days the
  // edited occurrence moved, preserving each occurrence's own original date
  // and the new span, rather than collapsing them onto a single date.
  const seriesEvents = await prisma.event.findMany({
    where: { seriesId: existing.seriesId, deletedAt: null },
  });

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
  // Only the series root stores the rule, so occurrences read it via the series relation.
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
