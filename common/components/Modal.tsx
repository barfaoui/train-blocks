import { type ReactNode, useEffect, useId } from 'react';

import styles from './Modal.module.scss';
import { TypographyLarge } from '../styles/Typography';

export type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ title, onClose, children, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={[styles.modal, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <TypographyLarge as="h2" variant="bold" id={titleId}>
            {title}
          </TypographyLarge>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      className={styles.closeIconSvg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
