export type FieldError = {
  path: string;
  message: string;
};

export type SignUpBody = {
  username: string;
  password: string;
};

export type SignInBody = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  username: string;
};

export const WEEK_STARTS = ['SUNDAY', 'MONDAY', 'SATURDAY'] as const;
export const TIME_FORMATS = ['H12', 'H24'] as const;
export const CALENDAR_VIEWS = ['MONTH', 'WEEK', 'DAY'] as const;
export const UNIT_SYSTEMS = ['METRIC', 'IMPERIAL'] as const;
export const THEMES = ['LIGHT', 'DARK', 'SYSTEM'] as const;
export const PROFILE_VISIBILITIES = ['PRIVATE', 'PARTICIPANTS'] as const;

export type UserPreferences = {
  weekStart: (typeof WEEK_STARTS)[number];
  timeFormat: (typeof TIME_FORMATS)[number];
  defaultView: (typeof CALENDAR_VIEWS)[number];
  locale: string;
  timezone: string;
  showWeekNumbers: boolean;
  workDayStart: number;
  workDayEnd: number;
  units: (typeof UNIT_SYSTEMS)[number];
  favoriteSports: string[];
  defaultSportType: string | null;
  defaultEventDurationMin: number;
  defaultReminders: number[];
  theme: (typeof THEMES)[number];
  notifyByEmail: boolean;
  profileVisibility: (typeof PROFILE_VISIBILITIES)[number];
};

// Preferences are edited one category at a time, each with its own endpoint.
export const PREFERENCE_CATEGORY_IDS = [
  'calendar',
  'training',
  'appearance',
  'notifications-privacy',
] as const;

export type PreferenceCategoryId = (typeof PREFERENCE_CATEGORY_IDS)[number];

// Any subset of a category's preferences. Reminders can't be edited yet.
export type UpdatePreferencesBody = Partial<Omit<UserPreferences, 'defaultReminders'>>;

// Mirrors the column defaults of `UserPreferences` in auths/service/prisma/schema.prisma,
// for users who don't have a preferences row yet.
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  weekStart: 'MONDAY',
  timeFormat: 'H24',
  defaultView: 'WEEK',
  locale: 'en',
  timezone: 'UTC',
  showWeekNumbers: false,
  workDayStart: 8,
  workDayEnd: 20,
  units: 'METRIC',
  favoriteSports: [],
  defaultSportType: null,
  defaultEventDurationMin: 60,
  defaultReminders: [30],
  theme: 'SYSTEM',
  notifyByEmail: false,
  profileVisibility: 'PRIVATE',
};

export type UpdateAvatarBody = {
  avatarIcon: string;
  avatarColor: string;
};

export type MeUser = AuthUser & {
  email: string | null;
  emailVerifiedAt: string | null;
  displayName: string | null;
  avatarIcon: string | null;
  avatarColor: string | null;
  createdAt: string;
  // null until the user has a preferences row (new sign-ups).
  preferences: UserPreferences | null;
};

export type AuthenticatedRequest = import('express').Request & {
  user: AuthUser;
};
