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
};
