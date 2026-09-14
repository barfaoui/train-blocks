import type { PlannerEvent, SportType } from '@common/planner-types';

import { prisma } from '../data/prisma';
import { toIsoDateString, toIsoTimeString } from '../utils/date.util';

export type ListEventsFilters = {
  startDate: string;
  endDate: string;
  sportTypes?: SportType[];
};

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
  };
}
