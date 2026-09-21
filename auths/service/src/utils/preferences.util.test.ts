import { describe, expect, it } from 'vitest';

import { initialPreferencesFor } from './preferences.util';

describe('initialPreferencesFor', () => {
  it('derives the locale, time zone, clock and first day of the week', () => {
    expect(initialPreferencesFor({ locale: 'fr-FR', timezone: 'Europe/Paris' })).toEqual({
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      timeFormat: 'H24',
      weekStart: 'MONDAY',
    });
  });

  it('uses a 12-hour clock and Sunday for US English', () => {
    expect(initialPreferencesFor({ locale: 'en-US' })).toMatchObject({
      timeFormat: 'H12',
      weekStart: 'SUNDAY',
    });
  });

  it('leaves everything to the column defaults without hints', () => {
    expect(initialPreferencesFor({})).toEqual({});
  });

  it('ignores an invalid locale or time zone', () => {
    expect(initialPreferencesFor({ locale: 'not a locale!', timezone: 'Mars/Olympus' })).toEqual(
      {},
    );
  });

  it('ignores values that are too long for their column', () => {
    expect(
      initialPreferencesFor({
        locale: 'en-US-x-aaaaaaaaaaaa',
        timezone: `Europe/${'a'.repeat(70)}`,
      }),
    ).toEqual({});
  });

  it('canonicalizes the time zone name', () => {
    expect(initialPreferencesFor({ timezone: 'europe/paris' }).timezone).toBe('Europe/Paris');
  });
});
