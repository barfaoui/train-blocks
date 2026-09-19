export const SPORT_TYPES = [
  'RUNNING',
  'TRAIL_RUNNING',
  'TREADMILL',
  'WALKING',
  'HIKING',
  'CYCLING',
  'MOUNTAIN_BIKING',
  'SWIMMING',
  'ROWING',
  'KAYAKING',
  'SAILING',
  'SURFING',
  'STRENGTH',
  'CROSSFIT',
  'GYMNASTICS',
  'YOGA',
  'PILATES',
  'STRETCHING',
  'JUMP_ROPE',
  'CLIMBING',
  'SKIING',
  'SNOWBOARDING',
  'ICE_SKATING',
  'ROLLER_SKATING',
  'SKATEBOARDING',
  'TENNIS',
  'BADMINTON',
  'TABLE_TENNIS',
  'FOOTBALL',
  'BASKETBALL',
  'VOLLEYBALL',
  'HANDBALL',
  'RUGBY',
  'AMERICAN_FOOTBALL',
  'BASEBALL',
  'HOCKEY',
  'GOLF',
  'BOXING',
  'MARTIAL_ARTS',
  'DANCE',
  'HORSEBACK_RIDING',
  'ARCHERY',
  'FENCING',
  'OTHER',
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

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

export type EventDeleteScope = EventEditScope | 'ALL_EVENTS';

export type UpdateEventResponse = {
  events: PlannerEvent[];
  truncated: boolean;
};
