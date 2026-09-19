import type { SportType } from '@common/planner-types';

import styles from './SportIcon.module.scss';
import { SPORT_TYPE_INFO } from '../../events/sport-types';

export type SportIconProps = {
  sportType: SportType;
  className?: string;
};

export function SportIcon({ sportType, className }: SportIconProps) {
  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(' ')}
      style={{ maskImage: `url("${SPORT_TYPE_INFO[sportType].icon}")` }}
      aria-hidden="true"
    />
  );
}
