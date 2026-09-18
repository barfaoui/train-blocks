import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { PlannerEvent, SportType } from '@common/planner-types';
import { TypographyLarge, TypographySmall } from '@common/styles/Typography';

import styles from './EventDetailsModal.module.scss';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  RUNNING: '🏃 Running',
  CYCLING: '🚴 Cycling',
  SWIMMING: '🏊 Swimming',
  STRENGTH: '🏋️ Strength',
  YOGA: '🧘 Yoga',
  OTHER: '🎯 Other',
};

const GAP = 12;
const VIEWPORT_PADDING = 8;

export type EventDetailsModalProps = {
  event: PlannerEvent;
  anchor: DOMRect;
  onClose: () => void;
  onEdit: () => void;
};

function toLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(toLocalDate(dateStr));
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatWhen(event: PlannerEvent): string {
  const sameDay = event.startDate === event.endDate;

  if (!event.startTime) {
    return sameDay
      ? formatDate(event.startDate)
      : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`;
  }

  const timeRange = event.endTime
    ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
    : formatTime(event.startTime);

  return sameDay
    ? `${formatDate(event.startDate)} · ${timeRange}`
    : `${formatDate(event.startDate)} ${formatTime(event.startTime)} – ${formatDate(event.endDate)} ${event.endTime ? formatTime(event.endTime) : ''}`;
}

function isRecurring(event: PlannerEvent): boolean {
  return event.seriesId !== null;
}

export function EventDetailsModal({ event, anchor, onClose, onEdit }: EventDetailsModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const { width, height } = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const anchorCenterX = anchor.left + anchor.width / 2;
    const showOnLeft = anchorCenterX > viewportWidth / 2;

    const rawLeft = showOnLeft ? anchor.left - GAP - width : anchor.right + GAP;
    const left = Math.min(
      Math.max(rawLeft, VIEWPORT_PADDING),
      viewportWidth - width - VIEWPORT_PADDING,
    );
    const top = Math.min(
      Math.max(anchor.top, VIEWPORT_PADDING),
      viewportHeight - height - VIEWPORT_PADDING,
    );

    setStyle({ position: 'fixed', top, left, visibility: 'visible' });
  }, [anchor]);

  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        onClose();
      }
    }

    function handlePointerDown(pointerEvent: MouseEvent) {
      if (!panelRef.current?.contains(pointerEvent.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className={styles.panel} style={style} role="dialog" aria-modal="false">
      <header className={styles.header}>
        <TypographyLarge as="h2" variant="bold" className={styles.title}>
          {event.title}
        </TypographyLarge>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </header>
      <div className={styles.body}>
        <TypographySmall className={styles.detailRow}>{formatWhen(event)}</TypographySmall>
        {isRecurring(event) ? (
          <TypographySmall className={styles.detailRow}>🔁 Recurring</TypographySmall>
        ) : null}
        <TypographySmall className={styles.detailRow}>
          {SPORT_TYPE_LABELS[event.sportType]}
        </TypographySmall>
        {event.location ? (
          <TypographySmall className={styles.detailRow}>📍 {event.location}</TypographySmall>
        ) : null}
        {event.description ? (
          <TypographySmall className={styles.description}>{event.description}</TypographySmall>
        ) : null}
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.actionButton} onClick={onEdit}>
          <TypographySmall>✏️ Edit</TypographySmall>
        </button>
        <button type="button" className={styles.actionButton}>
          <TypographySmall>📄 Duplicate</TypographySmall>
        </button>
        <button type="button" className={[styles.actionButton, styles['-danger']].join(' ')}>
          <TypographySmall>🗑️ Delete</TypographySmall>
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
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
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
