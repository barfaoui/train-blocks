import type { DatesSetArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { useState } from 'react';

import type { PlannerEvent } from '@common/planner-types';

import styles from './Calendar.module.scss';
import { type DateRange, useEvents } from '../../events/useEvents';

export function Calendar() {
  const [range, setRange] = useState<DateRange | null>(null);
  const { events } = useEvents(range);

  return (
    <div className={styles.calendar}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        height="auto"
        datesSet={(info: DatesSetArg) =>
          setRange({
            startDate: info.startStr.slice(0, 10),
            endDate: toInclusiveEndDate(info.endStr.slice(0, 10)),
          })
        }
        events={events.map(toFullCalendarEvent)}
      />
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
