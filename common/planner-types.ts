export const SPORT_TYPES = [
  // Running
  'OUTSIDE_RUNNING',
  'TRAIL_RUNNING',
  'TREADMILL',
  'MARATHON',
  // Walking
  'WALKING',
  'HIKING',
  // Cycling
  'STATIC_CYCLING',
  'BIKING',
  'MOUNTAIN_BIKING',
  // Water
  'SWIMMING',
  'WATER_POLO',
  'DIVING',
  'SCUBA',
  'ROWING',
  'KAYAKING',
  'SAILING',
  'SURFING',
  // Fitness
  'STRENGTH',
  'WEIGHT_TRAINING',
  'CROSSFIT',
  'CORE_TRAINING',
  'INDOOR_FITNESS',
  'FREE_TRAINING',
  'ELLIPTICAL',
  'STAIRS_CLIMBING',
  'JUMP_ROPE',
  'HULA_HOOP',
  // Mind and body
  'YOGA',
  'PILATES',
  'STRETCHING',
  'MEDITATION',
  'GYMNASTICS',
  'DANCE',
  // Climbing
  'ROCK_CLIMBING',
  // Winter
  'SKIING',
  'CROSS_COUNTRY_SKIING',
  'SNOWBOARDING',
  'ICE_SKATING',
  'FIGURE_SKATING',
  'SPEED_SKATING',
  'CURLING',
  // Wheels
  'ROLLER_SKATING',
  'SKATEBOARDING',
  'SCOOTER_RIDING',
  // Racket
  'TENNIS',
  'TABLE_TENNIS',
  'BADMINTON',
  // Team ball
  'FOOTBALL',
  'BASKETBALL',
  'VOLLEYBALL',
  'HANDBALL',
  'RUGBY',
  'AMERICAN_FOOTBALL',
  'BASEBALL',
  'HOCKEY',
  'FRISBEE',
  // Precision
  'GOLF',
  'BOWLING',
  'BILLIARDS',
  'ARCHERY',
  'SHOOTING',
  'FISHING',
  // Combat
  'BOXING',
  'MARTIAL_ARTS',
  'FENCING',
  // Air and riding
  'HORSEBACK_RIDING',
  'SKYDIVING',
  // Other
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
