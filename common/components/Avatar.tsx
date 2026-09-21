import styles from './Avatar.module.scss';
import { firstEmoji } from '../utils/emoji.util';

const FALLBACK_COLOR = '#0f766e';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// Black or white, whichever reads better on the given #RRGGBB background.
function contrastColor(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
}

export type AvatarProps = {
  icon?: string | null;
  color?: string | null;
  // Its first letter is shown when there is no emoji.
  name?: string | null;
  className?: string;
};

export function Avatar({ icon, color, name, className }: AvatarProps) {
  const background = color && HEX_COLOR.test(color) ? color : FALLBACK_COLOR;
  const emoji = icon ? firstEmoji(icon) : null;
  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(' ')}
      style={{ backgroundColor: background, color: contrastColor(background) }}
      aria-hidden="true"
    >
      {emoji ? <span className={styles.emoji}>{emoji}</span> : initial}
    </span>
  );
}
