export type SportType = 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'STRENGTH' | 'YOGA' | 'OTHER';

export type PlannerEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  sportType: SportType;
  description: string | null;
  location: string | null;
  seriesId: string | null;
  recurrenceRule: string | null;
  planId: string | null;
};

export type CreateEventBody = {
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  timezone: string;
  sportType: SportType;
  description?: string | null;
  location?: string | null;
  planId?: string | null;
  recurrenceRule?: string | null;
};

export type CreateEventResponse = {
  events: PlannerEvent[];
  truncated: boolean;
};

export type EventEditScope = 'THIS_EVENT' | 'THIS_AND_FUTURE_EVENTS';

export type UpdateEventBody = {
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  timezone: string;
  sportType: SportType;
  description?: string | null;
  location?: string | null;
  // Omit to keep the current recurrence; null turns the series into a single
  // event. Only applied when scope is THIS_AND_FUTURE_EVENTS (or the event isn't recurring yet).
  recurrenceRule?: string | null;
  scope: EventEditScope;
};

export type UpdateEventResponse = {
  events: PlannerEvent[];
  truncated: boolean;
};
