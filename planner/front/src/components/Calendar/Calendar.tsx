import type {
  DatesSetArg,
  DayCellContentArg,
  DayHeaderContentArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
  MoreLinkArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useRef, useState } from 'react';

import { Button } from '@common/components/Button';
import type { PlannerEvent, SportType } from '@common/planner-types';

import {
  type CalendarViewSlug,
  VIEW_OPTIONS,
  defaultViewSlug,
  fcViewNameFor,
  persistView,
  readStoredView,
} from './calendar-view.util';
import styles from './Calendar.module.scss';
import { type DateRange, useEvents } from '../../events/useEvents';
import { SportIcon } from '../SportIcon/SportIcon';

export type EventMoveChanges = Pick<
  PlannerEvent,
  'startDate' | 'endDate' | 'startTime' | 'endTime'
>;

export type CalendarProps = {
  onCreateRequested: (date: string, time?: string) => void;
  onEventClick: (event: PlannerEvent, anchor: DOMRect) => void;
  // Rejecting reverts the event to where it was dragged from.
  onEventMove: (event: PlannerEvent, changes: EventMoveChanges) => Promise<void>;
  // Recurring events aren't saved on drop: the drag is undone and the caller
  // decides what to do with the proposed changes.
  onRecurringEventMove: (event: PlannerEvent, changes: EventMoveChanges) => void;
  reloadKey?: number;
};

const ALL_DAY_COLLAPSE_THRESHOLD = 2;
// Month-view day cells always cap at 3 rows; overflow uses FullCalendar's own
// "+N more" popover (no custom arrow there, unlike the timeGrid all-day row).
const MONTH_DAY_MAX_EVENT_ROWS = 3;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Reads a wall-clock date/time as plain local strings, since converting
// through toISOString() would shift to UTC and can land on the wrong day.
function toLocalDateAndTime(date: Date): { date: string; time: string } {
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Translates FullCalendar's dropped event back into the API's inclusive-end
// date/time fields (its all-day `end` is exclusive, and `end` is null when the
// event had no end time).
function toMoveChanges(original: PlannerEvent, moved: EventApi): EventMoveChanges {
  const start = toLocalDateAndTime(moved.start as Date);

  if (moved.allDay) {
    return {
      startDate: start.date,
      endDate: moved.end ? shiftDate(toLocalDateAndTime(moved.end).date, -1) : start.date,
      startTime: null,
      endTime: null,
    };
  }

  if (moved.end) {
    const end = toLocalDateAndTime(moved.end);
    return {
      startDate: start.date,
      endDate: end.date,
      startTime: `${start.time}:00`,
      endTime: `${end.time}:00`,
    };
  }

  const spanDays = Math.round(
    (Date.parse(`${original.endDate}T00:00:00Z`) - Date.parse(`${original.startDate}T00:00:00Z`)) /
      86_400_000,
  );
  return {
    startDate: start.date,
    endDate: shiftDate(start.date, spanDays),
    startTime: `${start.time}:00`,
    endTime: null,
  };
}

function todayIsoDate(): string {
  return toLocalDateAndTime(new Date()).date;
}

function maxAllDayEventsPerDay(events: PlannerEvent[], range: DateRange | null): number {
  if (!range) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.startTime) {
      continue;
    }
    for (let day = event.startDate; day <= event.endDate; day = addOneDay(day)) {
      if (day >= range.startDate && day <= range.endDate) {
        counts.set(day, (counts.get(day) ?? 0) + 1);
      }
      if (day >= range.endDate) {
        break;
      }
    }
  }

  return counts.size > 0 ? Math.max(...counts.values()) : 0;
}

export function Calendar({
  onCreateRequested,
  onEventClick,
  onEventMove,
  onRecurringEventMove,
  reloadKey,
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewSlug, setViewSlug] = useState<CalendarViewSlug>(
    () => readStoredView() ?? defaultViewSlug(),
  );
  const [range, setRange] = useState<DateRange | null>(null);
  const [title, setTitle] = useState('');
  const [allDayCollapsed, setAllDayCollapsed] = useState(true);
  const { events } = useEvents(range, undefined, reloadKey);

  const needsAllDayCollapse = maxAllDayEventsPerDay(events, range) > ALL_DAY_COLLAPSE_THRESHOLD;
  const allDayRowLimit =
    needsAllDayCollapse && allDayCollapsed ? ALL_DAY_COLLAPSE_THRESHOLD : false;

  // Shared by dragging an event to a new slot and by resizing it.
  function handleEventChange(info: EventDropArg | EventResizeDoneArg) {
    const plannerEvent = events.find((event) => event.id === info.event.id);
    if (!plannerEvent || !info.event.start) {
      info.revert();
      return;
    }
    const changes = toMoveChanges(plannerEvent, info.event);
    if (plannerEvent.seriesId) {
      info.revert();
      onRecurringEventMove(plannerEvent, changes);
      return;
    }
    onEventMove(plannerEvent, changes).catch(() => info.revert());
  }

  function goToView(slug: CalendarViewSlug) {
    setViewSlug(slug);
    persistView(slug);
    calendarRef.current?.getApi().changeView(fcViewNameFor(slug));
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <Button
          type="button"
          label="✚ New event"
          style="small"
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
        locale="en"
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={fcViewNameFor(viewSlug)}
        views={{
          timeGrid3Day: {
            type: 'timeGrid',
            duration: { days: 3 },
            dayMaxEventRows: allDayRowLimit,
          },
          timeGridWeek: { dayMaxEventRows: allDayRowLimit },
          timeGridDay: { dayMaxEventRows: allDayRowLimit },
          dayGridMonth: { dayMaxEventRows: MONTH_DAY_MAX_EVENT_ROWS },
        }}
        headerToolbar={false}
        height="auto"
        dayCellContent={renderDayCellContent}
        dayHeaderContent={renderDayHeaderContent}
        eventContent={renderEventContent}
        allDayContent={() =>
          needsAllDayCollapse ? (
            <button
              type="button"
              className={styles.allDayToggle}
              aria-label={allDayCollapsed ? 'Show all all-day events' : 'Show fewer all-day events'}
              onClick={() => setAllDayCollapsed((collapsed) => !collapsed)}
            >
              {allDayCollapsed ? '▾' : '▴'}
            </button>
          ) : null
        }
        // Let FullCalendar show its own "+N more" link both for the timeGrid
        // all-day row and for month-view day cells; clicking it expands the
        // all-day row via our own arrow state, but still opens the default
        // popover in month view (arg.allDay is also true there, since every
        // month-view cell is an all-day cell, so the view type disambiguates).
        moreLinkClick={(arg: MoreLinkArg) => {
          if (arg.view.type === 'dayGridMonth' || !arg.allDay) {
            return 'popover';
          }
          setAllDayCollapsed(false);
          // FullCalendar's handler opens its popover for any falsy return
          // (including `undefined`/void) and navigates views for any string
          // return, so only a truthy, non-string value fully suppresses both.
          return true as unknown as void;
        }}
        datesSet={(info: DatesSetArg) => {
          setRange({
            startDate: info.startStr.slice(0, 10),
            endDate: toInclusiveEndDate(info.endStr.slice(0, 10)),
          });
          setTitle(info.view.title);
        }}
        dateClick={(info: DateClickArg) => {
          if (info.allDay) {
            onCreateRequested(info.dateStr);
            return;
          }
          const { date, time } = toLocalDateAndTime(info.date);
          onCreateRequested(date, time);
        }}
        editable
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={(info: EventClickArg) => {
          const plannerEvent = events.find((event) => event.id === info.event.id);
          if (plannerEvent) {
            onEventClick(plannerEvent, info.el.getBoundingClientRect());
          }
        }}
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

function renderEventContent(arg: EventContentArg) {
  return (
    <div className={styles.eventContent}>
      <SportIcon
        sportType={arg.event.extendedProps.sportType as SportType}
        className={styles.eventIcon}
      />
      <div className={styles.eventText}>
        <span className={styles.eventTitle}>{arg.event.title}</span>
        {arg.timeText ? <span className={styles.eventTime}>{arg.timeText}</span> : null}
      </div>
    </div>
  );
}

function renderDayHeaderContent(arg: DayHeaderContentArg) {
  if (arg.view.type === 'dayGridMonth') {
    return arg.text;
  }

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(arg.date);

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
    extendedProps: { sportType: event.sportType },
  };
}

// FullCalendar's `datesSet` reports an exclusive end date; the API's endDate is inclusive.
function toInclusiveEndDate(exclusiveEndDate: string): string {
  const date = new Date(`${exclusiveEndDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// FullCalendar's all-day `end` is exclusive, unlike the API's inclusive endDate.
// Also used to walk a multi-day event's date range when tallying all-day counts.
function addOneDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
