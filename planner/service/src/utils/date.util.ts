// Prisma returns @db.Date/@db.Time columns as JS Date objects (the time
// portion uses the 1970-01-01 epoch date). These extract just the ISO
// date or time-of-day portion for the wire format.

export function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toIsoTimeString(time: Date | null): string | null {
  return time ? time.toISOString().slice(11, 19) : null;
}
