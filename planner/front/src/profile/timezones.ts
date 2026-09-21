export type ZoneOption = { value: string; label: string };

const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
  .supportedValuesOf;

function offsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const options = {
      timeZone,
      timeZoneName: 'longOffset',
    } as unknown as Intl.DateTimeFormatOptions;
    const name = new Intl.DateTimeFormat('en', options)
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value;
    if (!name) {
      return null;
    }
    // "GMT", or "GMT+05:30" / "GMT-03:00".
    const match = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(name);
    if (!match) {
      return null;
    }
    const [, sign, hours, minutes] = match;
    return sign ? (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) : 0;
  } catch {
    return null;
  }
}

export function formatOffset(minutes: number): string {
  if (minutes === 0) {
    return 'UTC';
  }
  const abs = Math.abs(minutes);
  const rest = abs % 60;
  const clock = `${Math.floor(abs / 60)}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
  return `UTC${minutes < 0 ? '-' : '+'}${clock}`;
}

function cityOf(timeZone: string): string {
  return (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');
}

// "Paris (UTC+2)": the offset is today's, so it follows daylight saving.
export function timeZoneDisplay(timeZone: string, at = new Date()): string {
  const minutes = offsetMinutes(timeZone, at);
  if (timeZone === 'UTC') {
    return 'UTC';
  }
  return minutes === null ? timeZone : `${cityOf(timeZone)} (${formatOffset(minutes)})`;
}

function zoneOption(timeZone: string, at: Date): ZoneOption {
  return { value: timeZone, label: timeZoneDisplay(timeZone, at) };
}

function byLabel(a: ZoneOption, b: ZoneOption): number {
  return a.label.localeCompare(b.label);
}

// Building the list formats a date in each of the ~430 zones, which takes a noticeable
// fraction of a second. It only depends on the browser and the calendar day (offsets shift
// with daylight saving), so it is built once per day and shared by every form that needs it.
let cache: { day: string; options: ZoneOption[] } | null = null;

function allTimeZoneOptions(): ZoneOption[] {
  const now = new Date();
  const day = now.toDateString();
  if (cache?.day !== day) {
    const names = new Set(supportedValuesOf ? supportedValuesOf('timeZone') : []);
    names.add('UTC');
    cache = { day, options: [...names].map((name) => zoneOption(name, now)).sort(byLabel) };
  }
  return cache.options;
}

// Every zone the browser knows, labeled "City (UTC+x)" and sorted by city. `current` is always
// included, even if the browser doesn't list it.
export function timeZoneOptions(current: string): ZoneOption[] {
  const options = allTimeZoneOptions();
  if (options.some((option) => option.value === current)) {
    return options;
  }
  return [...options, zoneOption(current, new Date())].sort(byLabel);
}
