// Prisma returns @db.Date/@db.Time columns as JS Date objects (the time
// portion uses the 1970-01-01 epoch date). These extract just the ISO
// date or time-of-day portion for the wire format.

export function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toIsoTimeString(time: Date | null): string | null {
  return time ? time.toISOString().slice(11, 19) : null;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// `new Date('2026-02-30')` doesn't reject an out-of-range day/month, it
// silently rolls over to the next valid date (e.g. 2026-03-02). Round-tripping
// through toIsoDateString and comparing catches that instead of accepting it.
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && toIsoDateString(date) === value;
}

const ISO_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export function isValidIsoTime(value: string): boolean {
  return ISO_TIME_PATTERN.test(value);
}

export function addDaysToIsoDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDateString(d);
}
