import type { CalendarOptions } from '@fullcalendar/core';

import type { UserPreferences } from '@common/auth-types';

import type { CalendarViewSlug } from './calendar-view.util';

const FIRST_DAY: Record<UserPreferences['weekStart'], number> = {
  SUNDAY: 0,
  MONDAY: 1,
  SATURDAY: 6,
};

const VIEW_SLUG: Record<UserPreferences['defaultView'], CalendarViewSlug> = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
};

export function viewSlugFor(view: UserPreferences['defaultView']): CalendarViewSlug {
  return VIEW_SLUG[view];
}

function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

// FullCalendar options driven by the user's preferences. Returns nothing for a
// user without a preferences row so FullCalendar keeps its own defaults.
export function calendarOptionsFor(
  preferences: UserPreferences | null,
): Pick<
  CalendarOptions,
  | 'firstDay'
  | 'locale'
  | 'weekNumbers'
  | 'eventTimeFormat'
  | 'slotLabelFormat'
  | 'scrollTime'
  | 'businessHours'
> {
  if (!preferences) {
    return {};
  }

  const timeFormat = {
    hour: preferences.timeFormat === 'H24' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: preferences.timeFormat === 'H12',
    meridiem: 'short',
  } as const;
  const workDayStart = hourToTime(preferences.workDayStart);

  return {
    firstDay: FIRST_DAY[preferences.weekStart],
    locale: preferences.locale,
    weekNumbers: preferences.showWeekNumbers,
    eventTimeFormat: timeFormat,
    slotLabelFormat: timeFormat,
    // Opens the time grid at the start of the work day, and shades the hours
    // outside it, without hiding events that fall there.
    scrollTime: workDayStart,
    businessHours: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: workDayStart,
      endTime: hourToTime(preferences.workDayEnd),
    },
  };
}
