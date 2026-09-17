import type {
  DatesSetArg,
  DayCellContentArg,
  DayHeaderContentArg,
  EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@common/components/Button';
import type { PlannerEvent } from '@common/planner-types';

import {
  type CalendarViewSlug,
  DEFAULT_VIEW_SLUG,
  VIEW_OPTIONS,
  fcViewNameFor,
  isCalendarViewSlug,
  persistView,
  readStoredView,
} from './calendar-view.util';
import styles from './Calendar.module.scss';
import { type DateRange, useEvents } from '../../events/useEvents';

export type CalendarProps = {
  onCreateRequested: (date: string) => void;
  reloadKey?: number;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveInitialViewSlug(searchParams: URLSearchParams): CalendarViewSlug {
  const fromUrl = searchParams.get('view');
  if (isCalendarViewSlug(fromUrl)) {
    return fromUrl;
  }
  return readStoredView() ?? DEFAULT_VIEW_SLUG;
}

export function Calendar({ onCreateRequested, reloadKey }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewSlug, setViewSlug] = useState<CalendarViewSlug>(() =>
    resolveInitialViewSlug(searchParams),
  );
  const [range, setRange] = useState<DateRange | null>(null);
  const [title, setTitle] = useState('');
  const { events } = useEvents(range, undefined, reloadKey);

  function goToView(slug: CalendarViewSlug) {
    setViewSlug(slug);
    persistView(slug);
    calendarRef.current?.getApi().changeView(fcViewNameFor(slug));

    const params = new URLSearchParams(searchParams);
    if (slug === DEFAULT_VIEW_SLUG) {
      params.delete('view');
    } else {
      params.set('view', slug);
    }
    setSearchParams(params, { replace: true });
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <Button
          type="button"
          label="✚ Create event"
          small
          thin
          onClick={() => onCreateRequested(todayIsoDate())}
        />
        <span className={styles.title}>{title}</span>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Previous"
            onClick={() => calendarRef.current?.getApi().prev()}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.todayButton}
            onClick={() => calendarRef.current?.getApi().today()}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Next"
            onClick={() => calendarRef.current?.getApi().next()}
          >
            ›
          </button>
          <select
            className={styles.viewSelect}
            aria-label="Change calendar view"
            value={viewSlug}
            onChange={(event) => goToView(event.target.value as CalendarViewSlug)}
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={fcViewNameFor(viewSlug)}
        views={{
          timeGrid3Day: {
            type: 'timeGrid',
            duration: { days: 3 },
          },
        }}
        headerToolbar={false}
        height="auto"
        dayCellContent={renderDayCellContent}
        dayHeaderContent={renderDayHeaderContent}
        datesSet={(info: DatesSetArg) => {
          setRange({
            startDate: info.startStr.slice(0, 10),
            endDate: toInclusiveEndDate(info.endStr.slice(0, 10)),
          });
          setTitle(info.view.title);
        }}
        dateClick={(info: DateClickArg) => onCreateRequested(info.dateStr)}
        events={events.map(toFullCalendarEvent)}
      />
    </div>
  );
}

// Branches on `arg.view.type` (always accurate at call time) rather than the
// `viewSlug` React state, since toggling this prop between a function and
// `undefined` in sync with an imperative `changeView()` call races React's
// render cycle and leaves FullCalendar's header showing stale content.
function renderDayCellContent(arg: DayCellContentArg) {
  if (arg.view.type !== 'dayGridMonth') {
    return null;
  }

  return (
    <span
      className={[styles.dayNumber, arg.isToday ? styles['-today'] : undefined]
        .filter(Boolean)
        .join(' ')}
    >
      {arg.dayNumberText}
    </span>
  );
}

function renderDayHeaderContent(arg: DayHeaderContentArg) {
  if (arg.view.type === 'dayGridMonth') {
    return arg.text;
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(arg.date);

  return (
    <div className={styles.dayHeaderContent}>
      <span className={styles.weekdayLabel}>{weekday}</span>
      <span
        className={[styles.dayNumber, arg.isToday ? styles['-today'] : undefined]
          .filter(Boolean)
          .join(' ')}
      >
        {arg.date.getDate()}
      </span>
    </div>
  );
}

function toFullCalendarEvent(event: PlannerEvent): EventInput {
  const allDay = !event.startTime;

  return {
    id: event.id,
    title: event.title,
    start: allDay ? event.startDate : `${event.startDate}T${event.startTime}`,
    end: allDay
      ? addOneDay(event.endDate)
      : event.endTime
        ? `${event.endDate}T${event.endTime}`
        : undefined,
    allDay,
  };
}

// FullCalendar's `datesSet` reports an exclusive end date; the API's endDate is inclusive.
function toInclusiveEndDate(exclusiveEndDate: string): string {
  const date = new Date(`${exclusiveEndDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// FullCalendar's all-day `end` is exclusive, unlike the API's inclusive endDate.
function addOneDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
