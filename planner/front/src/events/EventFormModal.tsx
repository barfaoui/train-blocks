import { type ReactNode, type SubmitEvent, useMemo, useState } from 'react';

import { Button } from '@common/components/Button';
import { Checkbox } from '@common/components/Checkbox';
import { DateTimeInput } from '@common/components/DateTimeInput';
import { Modal } from '@common/components/Modal';
import { Select } from '@common/components/Select';
import { Textarea } from '@common/components/Textarea';
import { TextInput } from '@common/components/TextInput';
import { Toast } from '@common/components/Toast';
import { type EventEditScope, SPORT_TYPES, type SportType } from '@common/planner-types';
import { TypographySmall } from '@common/styles/Typography';
import { addMinutesToTime } from '@common/utils/time.util';

import styles from './EventFormModal.module.scss';
import { browserTimeZone } from './events-service';
import { SPORT_TYPE_INFO } from './sport-types';
import { useSession } from '../auth/session';
import { SportIcon } from '../components/SportIcon/SportIcon';

const SPORT_TYPE_OPTIONS = SPORT_TYPES.map((sportType) => ({
  value: sportType,
  label: SPORT_TYPE_INFO[sportType].label,
  icon: <SportIcon sportType={sportType} />,
}));

// The user's favorite sports first, in the order they chose them, then everything else.
function sportOptionsWithFavoritesFirst(favorites: string[]) {
  const favoriteOptions = favorites
    .map((favorite) => SPORT_TYPE_OPTIONS.find((option) => option.value === favorite))
    .filter((option) => option !== undefined);
  return [
    ...favoriteOptions,
    ...SPORT_TYPE_OPTIONS.filter((option) => !favorites.includes(option.value)),
  ];
}

export type RepeatFrequency = '' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const REPEAT_FREQUENCY_OPTIONS: { value: RepeatFrequency; label: string }[] = [
  { value: '', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

// RRule/RFC5545 BYDAY codes, Monday-first to match the ISO week used elsewhere in the app.
const WEEKDAYS: { value: string; label: string }[] = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

function intervalUnitLabel(frequency: RepeatFrequency, interval: number): string {
  const plural = interval !== 1;
  switch (frequency) {
    case 'DAILY':
      return plural ? 'days' : 'day';
    case 'WEEKLY':
      return plural ? 'weeks' : 'week';
    case 'MONTHLY':
      return plural ? 'months' : 'month';
    case 'YEARLY':
      return plural ? 'years' : 'year';
    case '':
      return '';
  }
}

export type EventFormValues = {
  title: string;
  sportType: SportType | '';
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  repeatFrequency: RepeatFrequency;
  repeatInterval: string;
  repeatWeekdays: string[];
  scope: EventEditScope;
};

type FieldErrors = Partial<
  Record<'title' | 'sportType' | 'startDate' | 'endDate' | 'endTime' | 'repeatInterval', string>
>;

export const EMPTY_FORM_VALUES: EventFormValues = {
  title: '',
  sportType: '',
  allDay: true,
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
  repeatFrequency: '',
  repeatInterval: '1',
  repeatWeekdays: [],
  scope: 'THIS_EVENT',
};

function validate(form: EventFormValues, showRepeat: boolean): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Title is required';
  }
  if (!form.sportType) {
    errors.sportType = 'Sport is required';
  }
  if (!form.startDate) {
    errors.startDate = 'Start date is required';
  }
  if (!form.endDate) {
    errors.endDate = 'End date is required';
  }
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.endDate = 'End date must be on or after the start date';
  }
  if (
    !form.allDay &&
    form.startDate === form.endDate &&
    form.startTime &&
    form.endTime &&
    form.startTime > form.endTime
  ) {
    errors.endTime = 'End time must be after the start time';
  }
  if (showRepeat && form.repeatFrequency) {
    const interval = Number(form.repeatInterval);
    if (!Number.isInteger(interval) || interval < 1) {
      errors.repeatInterval = 'Enter a whole number of 1 or more';
    }
  }

  return errors;
}

export function buildRecurrenceRule(form: EventFormValues): string | null {
  if (!form.repeatFrequency) {
    return null;
  }

  const parts = [`FREQ=${form.repeatFrequency}`];

  const interval = Number(form.repeatInterval);
  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  if (form.repeatFrequency === 'WEEKLY' && form.repeatWeekdays.length > 0) {
    parts.push(`BYDAY=${form.repeatWeekdays.join(',')}`);
  }

  return parts.join(';');
}

// Inverse of buildRecurrenceRule, for prefilling the repeat controls. Anything
// beyond FREQ/INTERVAL/BYDAY (e.g. COUNT) isn't editable here and is ignored.
export function parseRecurrenceRule(
  rule: string | null,
): Pick<EventFormValues, 'repeatFrequency' | 'repeatInterval' | 'repeatWeekdays'> {
  const parts = new Map(
    (rule ?? '').split(';').map((part) => part.split('=') as [string, string | undefined]),
  );
  const frequency = REPEAT_FREQUENCY_OPTIONS.find((option) => option.value === parts.get('FREQ'));

  return {
    repeatFrequency: frequency?.value ?? '',
    repeatInterval: parts.get('INTERVAL') ?? '1',
    repeatWeekdays: parts.get('BYDAY')?.split(',') ?? [],
  };
}

// Fields shared by the create and update request bodies.
export function toEventFields(form: EventFormValues) {
  return {
    title: form.title.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    startTime: form.allDay || !form.startTime ? null : `${form.startTime}:00`,
    endTime: form.allDay || !form.endTime ? null : `${form.endTime}:00`,
    timezone: browserTimeZone(),
    sportType: form.sportType as SportType,
    description: form.description.trim() || null,
    location: form.location.trim() || null,
  };
}

function FieldRow({
  icon,
  centered,
  children,
}: {
  icon: string;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={[styles.fieldRow, centered ? styles['-centered'] : undefined]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.control}>{children}</div>
    </div>
  );
}

export type EventFormModalProps = {
  title: string;
  submitLabel: string;
  initialValues: EventFormValues;
  showRepeat?: boolean;
  // Lets the user choose between the current occurrence and this one plus later ones;
  // the repeat controls then only apply (and show) when this-and-future is picked.
  showScope?: boolean;
  // Fills in the end time when a start time is picked and there is none yet.
  defaultDurationMin?: number;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onClose: () => void;
};

export function EventFormModal({
  title,
  submitLabel,
  initialValues,
  showRepeat = false,
  showScope = false,
  defaultDurationMin,
  onSubmit,
  onClose,
}: EventFormModalProps) {
  const { user } = useSession();
  const favoriteSports = user?.preferences?.favoriteSports;
  const sportOptions = useMemo(
    () => sportOptionsWithFavoritesFirst(favoriteSports ?? []),
    [favoriteSports],
  );
  const [form, setForm] = useState<EventFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const rowClass = [styles.row, form.allDay ? styles['-single'] : undefined]
    .filter(Boolean)
    .join(' ');
  const repeatVisible = showRepeat && (!showScope || form.scope === 'THIS_AND_FUTURE_EVENTS');

  function setField<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleWeekday(code: string) {
    setForm((current) => ({
      ...current,
      repeatWeekdays: current.repeatWeekdays.includes(code)
        ? current.repeatWeekdays.filter((value) => value !== code)
        : [...current.repeatWeekdays, code],
    }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const fieldErrors = validate(form, repeatVisible);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await onSubmit(form);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal title={title} onClose={onClose}>
        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
          <FieldRow icon="✏️">
            <TextInput
              aria-label="Title"
              placeholder="Title *"
              required
              value={form.title}
              error={errors.title}
              onChange={(value) => setField('title', value)}
            />
          </FieldRow>

          <FieldRow icon="🏃">
            <Select
              aria-label="Sport"
              placeholder="Sport *"
              required
              value={form.sportType}
              error={errors.sportType}
              options={sportOptions}
              onChange={(value) => setField('sportType', value as SportType)}
            />
          </FieldRow>

          <div className={styles.dateTimeContainer}>
            <Checkbox
              className={styles.allDay}
              label="🕒 All day"
              checked={form.allDay}
              onChange={(checked) => setField('allDay', checked)}
            />

            <FieldRow icon="🕒">
              <div className={rowClass}>
                <DateTimeInput
                  aria-label="Start date"
                  title="Start date"
                  type="date"
                  required
                  value={form.startDate}
                  error={errors.startDate}
                  onChange={(value) => setField('startDate', value)}
                />
                {!form.allDay ? (
                  <DateTimeInput
                    aria-label="Start time"
                    title="Start time"
                    type="time"
                    value={form.startTime}
                    onChange={(value) => {
                      setField('startTime', value);
                      if (defaultDurationMin && value && !form.endTime) {
                        setField('endTime', addMinutesToTime(value, defaultDurationMin));
                      }
                    }}
                  />
                ) : null}
              </div>
            </FieldRow>

            <FieldRow icon="🕒">
              <div className={rowClass}>
                <DateTimeInput
                  aria-label="End date"
                  title="End date"
                  type="date"
                  required
                  value={form.endDate}
                  error={errors.endDate}
                  onChange={(value) => setField('endDate', value)}
                />
                {!form.allDay ? (
                  <DateTimeInput
                    aria-label="End time"
                    title="End time"
                    type="time"
                    value={form.endTime}
                    error={errors.endTime}
                    onChange={(value) => setField('endTime', value)}
                  />
                ) : null}
              </div>
            </FieldRow>
          </div>

          {showScope ? (
            <FieldRow icon="🔗" centered>
              <Checkbox
                label="Update this and future events"
                checked={form.scope === 'THIS_AND_FUTURE_EVENTS'}
                onChange={(checked) =>
                  setField('scope', checked ? 'THIS_AND_FUTURE_EVENTS' : 'THIS_EVENT')
                }
              />
            </FieldRow>
          ) : null}

          {repeatVisible ? (
            <FieldRow icon="🔁">
              <Select
                aria-label="Repeat"
                value={form.repeatFrequency}
                options={REPEAT_FREQUENCY_OPTIONS}
                onChange={(value) => setField('repeatFrequency', value as RepeatFrequency)}
              />

              {form.repeatFrequency ? (
                <div className={styles.intervalRow}>
                  <TypographySmall className={styles.intervalUnit}>Every</TypographySmall>
                  <TextInput
                    aria-label="Every"
                    type="number"
                    min="1"
                    className={styles.intervalNumber}
                    value={form.repeatInterval}
                    error={errors.repeatInterval}
                    onChange={(value) => setField('repeatInterval', value)}
                  />
                  <TypographySmall className={styles.intervalUnit}>
                    {intervalUnitLabel(form.repeatFrequency, Number(form.repeatInterval))}
                  </TypographySmall>
                </div>
              ) : null}

              {form.repeatFrequency === 'WEEKLY' ? (
                <div className={styles.weekdays}>
                  {WEEKDAYS.map((day) => {
                    const selected = form.repeatWeekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        className={[
                          styles.weekdayButton,
                          selected ? styles['-selected'] : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-pressed={selected}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </FieldRow>
          ) : null}

          <FieldRow icon="📍">
            <TextInput
              aria-label="Location"
              placeholder="Location"
              value={form.location}
              onChange={(value) => setField('location', value)}
            />
          </FieldRow>

          <FieldRow icon="📝">
            <Textarea
              aria-label="Description"
              placeholder="Description"
              value={form.description}
              onChange={(value) => setField('description', value)}
            />
          </FieldRow>

          <div className={styles.actions}>
            <Button type="button" style="small" label="Cancel" outlined onClick={onClose} />
            <Button type="submit" style="small" label={submitLabel} isLoading={submitting} />
          </div>
        </form>
      </Modal>
      {apiError ? (
        <Toast message={apiError} variant="error" onClose={() => setApiError(null)} />
      ) : null}
    </>
  );
}
