import { describe, expect, it } from 'vitest';

import {
  appearancePreferencesBody,
  calendarPreferencesBody,
  notificationsPrivacyPreferencesBody,
  preferenceCategoryBodies,
  resetPasswordForm,
  trainingPreferencesBody,
  updateAvatarBody,
  updateDisplayNameBody,
} from './auth-validation';

describe('resetPasswordForm', () => {
  const valid = {
    currentPassword: 'OldSecret1!',
    newPassword: 'NewSecret2@',
    confirmPassword: 'NewSecret2@',
  };

  function firstMessage(values: typeof valid) {
    const result = resetPasswordForm(values).safeParse(values);
    return result.success ? undefined : result.error.issues[0]?.message;
  }

  it('accepts a valid, confirmed new password', () => {
    expect(resetPasswordForm(valid).safeParse(valid).success).toBe(true);
  });

  it('requires the current password', () => {
    expect(firstMessage({ ...valid, currentPassword: '' })).toBe('Enter your current password');
  });

  it('applies the password format rules to the new password', () => {
    expect(firstMessage({ ...valid, newPassword: 'short', confirmPassword: 'short' })).toBe(
      'Password must be at least 8 characters',
    );
  });

  it('rejects a new password equal to the current one', () => {
    expect(
      firstMessage({ ...valid, newPassword: 'OldSecret1!', confirmPassword: 'OldSecret1!' }),
    ).toBe('New password must be different from the current one');
  });

  it('rejects a confirmation that does not match', () => {
    expect(firstMessage({ ...valid, confirmPassword: 'Different3#' })).toBe(
      'Passwords do not match',
    );
  });
});

describe('updateAvatarBody', () => {
  it.each(['🏃', '🏃🏽', '👨‍👩‍👧', '🇹🇳'])('accepts the emoji %s', (avatarIcon) => {
    expect(updateAvatarBody.parse({ avatarIcon, avatarColor: '#7C3AED' }).avatarIcon).toBe(
      avatarIcon,
    );
  });

  it('keeps only the first emoji', () => {
    const parsed = updateAvatarBody.parse({ avatarIcon: '🏃 and more 🏊', avatarColor: '#7C3AED' });

    expect(parsed.avatarIcon).toBe('🏃');
  });

  it.each(['star', 'A', ''])('rejects %j as an icon', (avatarIcon) => {
    expect(updateAvatarBody.safeParse({ avatarIcon, avatarColor: '#7C3AED' }).success).toBe(false);
  });

  it.each(['red', '#fff', '7C3AED', '#GGGGGG'])('rejects %s as a color', (avatarColor) => {
    expect(updateAvatarBody.safeParse({ avatarIcon: '🏃', avatarColor }).success).toBe(false);
  });
});

describe('preference category bodies', () => {
  it('has a schema for every category', () => {
    expect(Object.keys(preferenceCategoryBodies).sort()).toEqual([
      'appearance',
      'calendar',
      'notifications-privacy',
      'training',
    ]);
  });

  it('accepts a partial update and canonicalizes locale and time zone', () => {
    expect(
      calendarPreferencesBody.parse({
        locale: 'fr-fr',
        timezone: 'europe/paris',
        weekStart: 'MONDAY',
      }),
    ).toEqual({ locale: 'fr-FR', timezone: 'Europe/Paris', weekStart: 'MONDAY' });
  });

  it.each([
    [{}, 'an empty body'],
    [{ weekStart: 'FRIDAY' }, 'an unknown week start'],
    [{ locale: 'not a locale!' }, 'an invalid locale'],
    [{ timezone: 'Mars/Olympus' }, 'an unknown time zone'],
    [{ workDayStart: 24 }, 'a start hour out of range'],
    [{ workDayEnd: 0 }, 'an end hour out of range'],
    [{ workDayStart: 10, workDayEnd: 10 }, 'an active day that ends when it starts'],
    [{ workDayStart: 6.5 }, 'a fractional hour'],
    [{ theme: 'DARK' }, 'a field from another category'],
  ])('rejects %j for calendar (%s)', (body) => {
    expect(calendarPreferencesBody.safeParse(body).success).toBe(false);
  });

  it('validates the training preferences', () => {
    expect(
      trainingPreferencesBody.parse({
        favoriteSports: ['SWIMMING', 'OUTSIDE_RUNNING', 'SWIMMING'],
        defaultSportType: null,
        defaultEventDurationMin: 45,
        units: 'IMPERIAL',
      }),
    ).toEqual({
      favoriteSports: ['SWIMMING', 'OUTSIDE_RUNNING'],
      defaultSportType: null,
      defaultEventDurationMin: 45,
      units: 'IMPERIAL',
    });
    expect(trainingPreferencesBody.safeParse({ favoriteSports: ['CHESS'] }).success).toBe(false);
    expect(trainingPreferencesBody.safeParse({ defaultEventDurationMin: 4 }).success).toBe(false);
    expect(trainingPreferencesBody.safeParse({ defaultEventDurationMin: 1441 }).success).toBe(
      false,
    );
    expect(trainingPreferencesBody.safeParse({ defaultReminders: [15] }).success).toBe(false);
  });

  it('validates the appearance and notification preferences', () => {
    expect(appearancePreferencesBody.parse({ theme: 'DARK' })).toEqual({ theme: 'DARK' });
    expect(appearancePreferencesBody.safeParse({ theme: 'BLUE' }).success).toBe(false);
    expect(
      notificationsPrivacyPreferencesBody.parse({
        notifyByEmail: true,
        searchable: true,
      }),
    ).toEqual({ notifyByEmail: true, searchable: true });
    expect(notificationsPrivacyPreferencesBody.safeParse({ searchable: 'PRIVATE' }).success).toBe(
      false,
    );
    expect(
      notificationsPrivacyPreferencesBody.safeParse({ profileVisibility: 'PRIVATE' }).success,
    ).toBe(false);
    expect(notificationsPrivacyPreferencesBody.safeParse({ notifyByEmail: 'yes' }).success).toBe(
      false,
    );
  });
});

describe('updateDisplayNameBody', () => {
  it('trims the name', () => {
    expect(updateDisplayNameBody.parse({ displayName: '  Bochra A.  ' }).displayName).toBe(
      'Bochra A.',
    );
  });

  it.each(['', '   '])('turns %j into null, which clears the name', (displayName) => {
    expect(updateDisplayNameBody.parse({ displayName }).displayName).toBeNull();
  });

  it('rejects a name longer than 64 characters', () => {
    expect(updateDisplayNameBody.safeParse({ displayName: 'a'.repeat(65) }).success).toBe(false);
    expect(updateDisplayNameBody.safeParse({ displayName: 'a'.repeat(64) }).success).toBe(true);
  });

  it('rejects a missing or non-string name', () => {
    expect(updateDisplayNameBody.safeParse({}).success).toBe(false);
    expect(updateDisplayNameBody.safeParse({ displayName: 42 }).success).toBe(false);
  });
});
