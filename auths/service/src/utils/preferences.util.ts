import type { UserPreferences } from '@common/auth-types';

export type BrowserHints = {
  locale?: string;
  timezone?: string;
};

type InitialPreferences = Partial<
  Pick<UserPreferences, 'locale' | 'timezone' | 'timeFormat' | 'weekStart'>
>;

const LOCALE_MAX_LENGTH = 16;
const TIMEZONE_MAX_LENGTH = 64;

const WEEK_START_BY_FIRST_DAY: Record<number, UserPreferences['weekStart']> = {
  1: 'MONDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

function validLocale(locale: string | undefined): string | undefined {
  if (!locale) {
    return undefined;
  }
  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    return canonical.length <= LOCALE_MAX_LENGTH ? canonical : undefined;
  } catch {
    return undefined;
  }
}

function validTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone || timeZone.length > TIMEZONE_MAX_LENGTH) {
    return undefined;
  }
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

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

  const locale = validLocale(hints.locale);
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

  const timezone = validTimeZone(hints.timezone);
  if (timezone) {
    preferences.timezone = timezone;
  }

  return preferences;
}
