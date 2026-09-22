import { useEffect } from 'react';

import styles from './Toast.module.scss';
import { TypographySmall } from '../styles/Typography';

export type ToastVariant = 'error' | 'success';

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, variant = 'error', onClose, duration = 6000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={[styles.toast, styles[`-${variant}`]].filter(Boolean).join(' ')} role="alert">
      <TypographySmall className={styles.message}>{message}</TypographySmall>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
