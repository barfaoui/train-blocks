import type { UserPreferences } from '@common/auth-types';
import { canonicalLocale, canonicalTimeZone } from '@common/utils/intl.util';

export type BrowserHints = {
  locale?: string;
  timezone?: string;
};

type InitialPreferences = Partial<
  Pick<UserPreferences, 'locale' | 'timezone' | 'timeFormat' | 'weekStart'>
>;

const WEEK_START_BY_FIRST_DAY: Record<number, UserPreferences['weekStart']> = {
  1: 'MONDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

function firstDayOfWeek(locale: string): number | undefined {
  const intlLocale = new Intl.Locale(locale) as unknown as {
    getWeekInfo?: () => { firstDay: number };
    weekInfo?: { firstDay: number };
  };
  return (intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo)?.firstDay;
}

// Preferences worth guessing from what the browser reports at sign-up. Anything that can't
// be worked out is left out, so the column defaults apply.
export function initialPreferencesFor(hints: BrowserHints): InitialPreferences {
  const preferences: InitialPreferences = {};

  const locale = canonicalLocale(hints.locale);
  if (locale) {
    preferences.locale = locale;
    preferences.timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
      .hour12
      ? 'H12'
      : 'H24';

    const firstDay = firstDayOfWeek(locale);
    if (firstDay !== undefined && WEEK_START_BY_FIRST_DAY[firstDay]) {
      preferences.weekStart = WEEK_START_BY_FIRST_DAY[firstDay];
    }
  }

  const timezone = canonicalTimeZone(hints.timezone);
  if (timezone) {
    preferences.timezone = timezone;
  }

  return preferences;
}
