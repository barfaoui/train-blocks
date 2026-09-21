import {
  type PreferenceCategoryId,
  type UpdatePreferencesBody,
  type UserPreferences,
} from '@common/auth-types';
import { type SportType } from '@common/planner-types';
import { formatHour } from '@common/utils/time.util';

import { timeZoneDisplay } from './timezones';
import { SPORT_TYPE_INFO } from '../events/sport-types';

export type Option = { value: string; label: string };

export type FieldKind =
  | { type: 'select'; options: Option[] }
  | { type: 'boolean' }
  | { type: 'number'; min: number; max: number }
  | { type: 'text'; helperText?: string }
  // Hour of the day; an "end" hour may be 24 (midnight closing the day).
  | { type: 'hour'; role: 'start' | 'end' }
  | { type: 'timezone' }
  | { type: 'sport' }
  | { type: 'sports' };

export type PreferenceField = {
  key: keyof UserPreferences;
  label: string;
  kind: FieldKind;
};

export type PreferenceCategory = {
  id: PreferenceCategoryId;
  title: string;
  description: string;
  fields: PreferenceField[];
};

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'How your calendar looks and where it starts.',
    fields: [
      {
        key: 'weekStart',
        label: 'Week starts on',
        kind: {
          type: 'select',
          options: [
            { value: 'MONDAY', label: 'Monday' },
            { value: 'SUNDAY', label: 'Sunday' },
            { value: 'SATURDAY', label: 'Saturday' },
          ],
        },
      },
      {
        key: 'timeFormat',
        label: 'Time format',
        kind: {
          type: 'select',
          options: [
            { value: 'H24', label: '24-hour' },
            { value: 'H12', label: '12-hour (AM/PM)' },
          ],
        },
      },
      {
        key: 'defaultView',
        label: 'Default view',
        kind: {
          type: 'select',
          options: [
            { value: 'DAY', label: 'Day' },
            { value: 'WEEK', label: 'Week' },
            { value: 'MONTH', label: 'Month' },
          ],
        },
      },
      { key: 'showWeekNumbers', label: 'Show week numbers', kind: { type: 'boolean' } },
      {
        key: 'workDayStart',
        label: 'Active day starts at',
        kind: { type: 'hour', role: 'start' },
      },
      { key: 'workDayEnd', label: 'Active day ends at', kind: { type: 'hour', role: 'end' } },
      {
        key: 'locale',
        label: 'Language and region',
        kind: { type: 'text', helperText: 'A language tag such as en, en-GB or fr-FR.' },
      },
      { key: 'timezone', label: 'Time zone', kind: { type: 'timezone' } },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Defaults used when you plan a session.',
    fields: [
      {
        key: 'units',
        label: 'Units',
        kind: {
          type: 'select',
          options: [
            { value: 'METRIC', label: 'Metric (km, kg)' },
            { value: 'IMPERIAL', label: 'Imperial (mi, lb)' },
          ],
        },
      },
      { key: 'defaultSportType', label: 'Default sport', kind: { type: 'sport' } },
      { key: 'favoriteSports', label: 'Favorite sports', kind: { type: 'sports' } },
      {
        key: 'defaultEventDurationMin',
        label: 'Default duration (minutes)',
        kind: { type: 'number', min: 5, max: 1440 },
      },
      // `defaultReminders` is left out until reminders are available.
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'The look of the app.',
    fields: [
      {
        key: 'theme',
        label: 'Theme',
        kind: {
          type: 'select',
          options: [
            { value: 'SYSTEM', label: 'Match my device' },
            { value: 'LIGHT', label: 'Light' },
            { value: 'DARK', label: 'Dark' },
          ],
        },
      },
    ],
  },
  {
    id: 'notifications-privacy',
    title: 'Notifications & privacy',
    description: 'What we send you and whether other people can find you.',
    fields: [
      { key: 'notifyByEmail', label: 'Email notifications', kind: { type: 'boolean' } },
      {
        key: 'searchable',
        label: 'Can people find me using my username?',
        kind: { type: 'boolean' },
      },
    ],
  },
];

function sportLabel(sport: string): string {
  return SPORT_TYPE_INFO[sport as SportType]?.label ?? sport;
}

export function displayValue(field: PreferenceField, preferences: UserPreferences): string {
  const value = preferences[field.key];

  switch (field.kind.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'select':
      return field.kind.options.find((option) => option.value === value)?.label ?? '—';
    case 'hour':
      return formatHour(value as number, preferences.timeFormat === 'H12');
    case 'timezone':
      return timeZoneDisplay(value as string);
    case 'sport':
      return value ? sportLabel(value as string) : 'None';
    case 'sports': {
      const sports = value as string[];
      return sports.length > 0 ? sports.map(sportLabel).join(', ') : 'None';
    }
    case 'number':
      return `${value} min`;
    case 'text':
      return String(value ?? '—');
  }
}

// Editing works on plain strings so a field can be cleared or half-typed.
// A list is its items joined by commas.
export type Draft = Record<keyof UserPreferences, string>;

export function toDraft(preferences: UserPreferences): Draft {
  return Object.fromEntries(
    Object.entries(preferences).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(',') : value === null ? '' : String(value),
    ]),
  ) as Draft;
}

export function parseList(value: string): string[] {
  return value ? value.split(',') : [];
}

export type DraftErrors = Partial<Record<keyof UserPreferences, string>>;

export function validateDraft(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};

  if (Number(draft.workDayEnd) <= Number(draft.workDayStart)) {
    errors.workDayEnd = 'Must be after the start of the active day';
  }

  const duration = Number(draft.defaultEventDurationMin);
  if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
    errors.defaultEventDurationMin = 'Enter a whole number between 5 and 1440';
  }

  return errors;
}

function toValue(field: PreferenceField, value: string): unknown {
  switch (field.kind.type) {
    case 'boolean':
      return value === 'true';
    case 'number':
    case 'hour':
      return Number(value);
    case 'sport':
      return value || null;
    case 'sports':
      return parseList(value);
    case 'select':
    case 'timezone':
    case 'text':
      return value;
  }
}

export function changesFor(
  category: PreferenceCategory,
  initial: Draft,
  draft: Draft,
): UpdatePreferencesBody {
  return Object.fromEntries(
    category.fields
      .filter((field) => draft[field.key] !== initial[field.key])
      .map((field) => [field.key, toValue(field, draft[field.key])]),
  );
}
