import type { SportType } from '@common/planner-types';

import styles from './SportIcon.module.scss';
import { SPORT_TYPE_INFO } from '../../events/sport-types';

const ICON_URLS = import.meta.glob<string>('../../../assets/sports/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

function iconUrl(name: string): string | undefined {
  return ICON_URLS[`../../../assets/sports/${name}.svg`];
}

export type SportIconProps = {
  sportType: SportType;
  className?: string;
};

export function SportIcon({ sportType, className }: SportIconProps) {
  const url = iconUrl(SPORT_TYPE_INFO[sportType].icon);

  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(' ')}
      style={url ? { maskImage: `url("${url}")` } : undefined}
      aria-hidden="true"
    />
  );
}
