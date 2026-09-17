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
