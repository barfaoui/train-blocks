import styles from './ThemeToggle.module.scss';
import { useTheme } from '../styles/ThemeProvider';

function SunIcon() {
  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.93 4.93l1.06 1.06M18.01 18.01l1.06 1.06M3 12h1.5M19.5 12H21M4.93 19.07l1.06-1.06M18.01 5.99l1.06-1.06" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const isDark = resolved === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${next} theme`}
      onClick={() => setPreference(next)}
    >
      <span className={`${styles.icon} ${styles['-sun']}`}>
        <SunIcon />
      </span>
      <span className={styles.thumb} />
      <span className={`${styles.icon} ${styles['-moon']}`}>
        <MoonIcon />
      </span>
    </button>
  );
}
