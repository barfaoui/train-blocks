// Column widths of the preferences table these values are stored in.
export const LOCALE_MAX_LENGTH = 16;
export const TIMEZONE_MAX_LENGTH = 64;

// The canonical form of a BCP 47 language tag (`en-us` becomes `en-US`), or undefined when
// it isn't a valid tag or doesn't fit its column.
export function canonicalLocale(locale: string | undefined): string | undefined {
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

// The canonical name of an IANA time zone (`europe/paris` becomes `Europe/Paris`), or
// undefined when it isn't a known zone or doesn't fit its column.
export function canonicalTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone || timeZone.length > TIMEZONE_MAX_LENGTH) {
    return undefined;
  }
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}
