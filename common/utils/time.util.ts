export type Meridiem = 'AM' | 'PM';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// 0-23 (or 24, for "end of day") to a 12-hour clock reading. 0 and 24 are 12 AM.
export function to12Hour(hour24: number): { hour: number; period: Meridiem } {
  const wrapped = hour24 % 24;
  return { hour: wrapped % 12 || 12, period: wrapped >= 12 ? 'PM' : 'AM' };
}

// Inverse of to12Hour. Midnight is 0 for a start-of-day hour and 24 for an end-of-day one.
export function to24Hour(hour12: number, period: Meridiem, isEnd = false): number {
  const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
  return isEnd && hour24 === 0 ? 24 : hour24;
}

export function formatHour(hour24: number, use12Hour: boolean): string {
  if (!use12Hour) {
    return `${pad(hour24)}:00`;
  }
  const { hour, period } = to12Hour(hour24);
  return `${hour}:00 ${period}`;
}

// Adds minutes to an HH:MM time. Caps at 23:59 rather than rolling into the next day.
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = Math.min(hours * 60 + mins + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
