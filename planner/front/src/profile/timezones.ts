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

// "UTC+1", "UTC+5:30", "UTC"
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

// Every zone the browser knows, labeled "City (UTC+x)" and sorted by city. `current` is always
// included, even if the browser doesn't list it.
export function timeZoneOptions(current: string, at = new Date()): ZoneOption[] {
  const names = new Set(supportedValuesOf ? supportedValuesOf('timeZone') : []);
  names.add('UTC');
  names.add(current);

  return [...names]
    .map((name) => ({ value: name, label: timeZoneDisplay(name, at) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
