import { type ZodError, z } from 'zod';

import {
  CALENDAR_VIEWS,
  type PreferenceCategoryId,
  THEMES,
  TIME_FORMATS,
  UNIT_SYSTEMS,
  type UpdatePreferencesBody,
  WEEK_STARTS,
} from './auth-types';
import { SPORT_TYPES } from './planner-types';
import { firstEmoji } from './utils/emoji.util';
import { canonicalLocale, canonicalTimeZone } from './utils/intl.util';

export const username = z
  .string()
  .trim()
  .min(3, 'Username must be 3–32 characters')
  .max(32, 'Username must be 3–32 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
  .transform((value) => value.toLowerCase());

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const signUpBody = z.object({
  username,
  password,
});

// Browser hints for the starting preferences; invalid ones are ignored by the service.
export const signUpRequest = signUpBody.extend({
  locale: z.string().max(64).optional(),
  timezone: z.string().max(64).optional(),
});

export const signInBody = z.object({
  username,
  password: z.string().min(1, 'Password is required'),
});

// Only the first emoji is kept; anything after it is dropped.
export const avatarIcon = z
  .string()
  .max(64, 'Avatar emoji is too long')
  .refine((value) => firstEmoji(value) !== null, 'Avatar must be an emoji')
  .transform((value) => firstEmoji(value) as string);

export const avatarColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Avatar color must be a #RRGGBB hex');

export const updateAvatarBody = z.object({ avatarIcon, avatarColor });

export const updateDisplayNameBody = z.object({
  displayName: z
    .string()
    .trim()
    .max(64, 'Display name must be 64 characters or fewer')
    .transform((value) => value || null),
});

export const email = z
  .string()
  .trim()
  .max(255, 'Email must be 255 characters or fewer')
  .pipe(z.email('Enter a valid email address'))
  .transform((value) => value.toLowerCase());

export const setEmailBody = z.object({ email });

// Verification tokens are 32 random bytes in base64url.
export const verifyEmailBody = z.object({
  token: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/, 'This verification link is invalid or has expired'),
});

export function confirmPassword(password: string) {
  return z
    .string()
    .min(1, 'Confirm your password')
    .refine((value) => value === password, { message: 'Passwords do not match' });
}

export function resetPasswordForm(values: { currentPassword: string; newPassword: string }) {
  return z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password.refine((value) => value !== values.currentPassword, {
      message: 'New password must be different from the current one',
    }),
    confirmPassword: confirmPassword(values.newPassword),
  });
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && result[key] === undefined) {
      result[key] = issue.message;
    }
  }

  return result;
}

const locale = z
  .string()
  .refine(
    (value) => canonicalLocale(value) !== undefined,
    'Enter a valid language tag, like en or fr-FR',
  )
  .transform((value) => canonicalLocale(value) as string);

const timezone = z
  .string()
  .refine((value) => canonicalTimeZone(value) !== undefined, 'Enter a valid time zone')
  .transform((value) => canonicalTimeZone(value) as string);

const sportType = z.enum(SPORT_TYPES);

// Any subset of the fields, at least one, and nothing unknown.
function partialBody<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .partial()
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Nothing to update');
}

export const calendarPreferencesBody = partialBody({
  weekStart: z.enum(WEEK_STARTS),
  timeFormat: z.enum(TIME_FORMATS),
  defaultView: z.enum(CALENDAR_VIEWS),
  locale,
  timezone,
  showWeekNumbers: z.boolean(),
  workDayStart: z.number().int().min(0).max(23),
  workDayEnd: z.number().int().min(1).max(24),
}).refine(
  ({ workDayStart, workDayEnd }) =>
    workDayStart === undefined || workDayEnd === undefined || workDayEnd > workDayStart,
  { path: ['workDayEnd'], message: 'The active day must end after it starts' },
);

export const trainingPreferencesBody = partialBody({
  units: z.enum(UNIT_SYSTEMS),
  defaultSportType: sportType.nullable(),
  favoriteSports: z.array(sportType).transform((sports) => [...new Set(sports)]),
  defaultEventDurationMin: z.number().int().min(5).max(1440),
});

export const appearancePreferencesBody = partialBody({ theme: z.enum(THEMES) });

export const notificationsPrivacyPreferencesBody = partialBody({
  notifyByEmail: z.boolean(),
  searchable: z.boolean(),
});

export const preferenceCategoryBodies: Record<
  PreferenceCategoryId,
  z.ZodType<UpdatePreferencesBody>
> = {
  calendar: calendarPreferencesBody,
  training: trainingPreferencesBody,
  appearance: appearancePreferencesBody,
  'notifications-privacy': notificationsPrivacyPreferencesBody,
};
