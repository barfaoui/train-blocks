import styles from './ShowHideButton.module.scss';

function EyeIcon() {
  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.9 17.9 0 0 1-3.2 4.4" />
      <path d="M6.7 6.7C3.8 8.6 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" />
    </svg>
  );
}

export type ShowHideButtonProps = {
  visible: boolean;
  onToggle: () => void;
  controlsId?: string;
  showLabel?: string;
  hideLabel?: string;
  className?: string;
};

export function ShowHideButton({
  visible,
  onToggle,
  controlsId,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  className,
}: ShowHideButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(' ')}
      aria-label={visible ? hideLabel : showLabel}
      aria-pressed={visible}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
