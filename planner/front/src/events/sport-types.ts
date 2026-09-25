import { SPORT_TYPES, type SportType } from '@common/planner-types';

export type SportTypeInfo = {
  label: string;
  icon: string;
};

function toTitleCase(sportType: string): string {
  return sportType
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export const SPORT_TYPE_INFO = Object.fromEntries(
  SPORT_TYPES.map((sportType) => [
    sportType,
    { label: toTitleCase(sportType), icon: sportType.toLowerCase().replace(/_/g, '-') },
  ]),
) as Record<SportType, SportTypeInfo>;
