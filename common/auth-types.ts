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

export type UserPreferences = {
  weekStart: 'SUNDAY' | 'MONDAY' | 'SATURDAY';
  timeFormat: 'H12' | 'H24';
  defaultView: 'MONTH' | 'WEEK' | 'DAY';
  locale: string;
  timezone: string;
  showWeekNumbers: boolean;
  workDayStart: number;
  workDayEnd: number;
  units: 'METRIC' | 'IMPERIAL';
  favoriteSports: string[];
  defaultSportType: string | null;
  defaultEventDurationMin: number;
  defaultReminders: number[];
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  notifyByEmail: boolean;
  profileVisibility: 'PRIVATE' | 'PARTICIPANTS';
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
