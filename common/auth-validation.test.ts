import { describe, expect, it } from 'vitest';

import { resetPasswordForm, updateAvatarBody } from './auth-validation';

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
