import { RRule } from 'rrule';

import { toIsoDateString } from './date.util';
import { InvalidRecurrenceRuleError } from '../data/types/errors';

export const MAX_RECURRENCE_OCCURRENCES = 52;
const MAX_RECURRENCE_HORIZON_DAYS = 366;

const ALLOWED_FREQUENCIES = [RRule.YEARLY, RRule.MONTHLY, RRule.WEEKLY, RRule.DAILY];

export type RecurrenceExpansion = {
  // Ascending 'YYYY-MM-DD' dates; occurrenceDates[0] === startDate. Length <= MAX_RECURRENCE_OCCURRENCES.
  occurrenceDates: string[];
  truncated: boolean;
};

export function expandRecurrence(recurrenceRule: string, startDate: string): RecurrenceExpansion {
  const dtstart = new Date(`${startDate}T00:00:00Z`);

  let rule: RRule;
  try {
    const parsed = RRule.parseString(recurrenceRule);
    if (parsed.freq === undefined || !ALLOWED_FREQUENCIES.includes(parsed.freq)) {
      throw new InvalidRecurrenceRuleError();
    }
    rule = new RRule({ ...parsed, dtstart });
  } catch (error) {
    if (error instanceof InvalidRecurrenceRuleError) {
      throw error;
    }
    throw new InvalidRecurrenceRuleError();
  }

  const horizon = new Date(dtstart);
  horizon.setUTCDate(horizon.getUTCDate() + MAX_RECURRENCE_HORIZON_DAYS);

  let generated: Date[];
  try {
    generated = rule.between(dtstart, horizon, true);
  } catch {
    throw new InvalidRecurrenceRuleError();
  }

  // Force startDate to be occurrence #1 even if the rule's own pattern (e.g.
  // BYDAY) wouldn't naturally produce it on that exact date — the root
  // Event row's startDate is always the caller's startDate, so the
  // occurrence list must agree with it or the root would be "off-pattern".
  const hasStart = generated.some((date) => date.getTime() === dtstart.getTime());
  const withStart = hasStart ? generated : [dtstart, ...generated];

  const truncated = withStart.length > MAX_RECURRENCE_OCCURRENCES;
  return {
    occurrenceDates: withStart.slice(0, MAX_RECURRENCE_OCCURRENCES).map(toIsoDateString),
    truncated,
  };
}
