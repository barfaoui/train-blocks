export type CalendarViewSlug = 'day' | '3day' | 'week' | 'month';

const DEFAULT_VIEW_SLUG: CalendarViewSlug = 'week';
const SMALL_SCREEN_QUERY = '(max-width: 30rem)';

// A full week is too cramped on a phone, so small screens start on 3 days
export function defaultViewSlug(): CalendarViewSlug {
  return window.matchMedia(SMALL_SCREEN_QUERY).matches ? '3day' : DEFAULT_VIEW_SLUG;
}

export const VIEW_OPTIONS: { slug: CalendarViewSlug; fcView: string; label: string }[] = [
  { slug: 'day', fcView: 'timeGridDay', label: 'Day' },
  { slug: '3day', fcView: 'timeGrid3Day', label: '3 Days' },
  { slug: 'week', fcView: 'timeGridWeek', label: 'Week' },
  { slug: 'month', fcView: 'dayGridMonth', label: 'Month' },
];

export function fcViewNameFor(slug: CalendarViewSlug): string {
  return VIEW_OPTIONS.find((option) => option.slug === slug)?.fcView ?? 'timeGridWeek';
}

export function isCalendarViewSlug(value: string | null): value is CalendarViewSlug {
  return value !== null && VIEW_OPTIONS.some((option) => option.slug === value);
}

const VIEW_STORAGE_KEY = 'tp-calendar-view';

export function readStoredView(): CalendarViewSlug | null {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    return isCalendarViewSlug(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function persistView(slug: CalendarViewSlug): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, slug);
  } catch {
    // private mode / blocked storage
  }
}
