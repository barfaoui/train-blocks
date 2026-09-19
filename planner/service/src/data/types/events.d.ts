import type { PlannerEvent, SportType } from '@common/planner-types';

export type ListEventsFilters = {
  startDate: string;
  endDate: string;
  sportTypes?: SportType[];
};

export type CreateEventInput = {
  title: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  sportType: SportType;
  description: string | null;
  location: string | null;
  planId: string | null;
  recurrenceRule: string | null;
};

export type CreateEventResult = {
  events: PlannerEvent[];
  truncated: boolean;
};

export type EventEditScope = 'THIS_EVENT' | 'THIS_AND_FUTURE_EVENTS';

export type UpdateEventInput = {
  title: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  sportType: SportType;
  description: string | null;
  location: string | null;
  // undefined keeps the current recurrence; null removes it.
  recurrenceRule?: string | null;
  scope: EventEditScope;
};

export type UpdateEventResult = {
  events: PlannerEvent[];
  truncated: boolean;
};
