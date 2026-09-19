import { type SubmitEvent, useState } from 'react';

import { Button } from '@common/components/Button';
import { Checkbox } from '@common/components/Checkbox';
import { DateTimeInput } from '@common/components/DateTimeInput';
import { Modal } from '@common/components/Modal';
import { Select } from '@common/components/Select';
import { Textarea } from '@common/components/Textarea';
import { TextInput } from '@common/components/TextInput';
import { Toast } from '@common/components/Toast';
import type { EventEditScope, SportType } from '@common/planner-types';
import { TypographySmall } from '@common/styles/Typography';

import styles from './EventFormModal.module.scss';

const SPORT_TYPE_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'RUNNING', label: '🏃 Running' },
  { value: 'CYCLING', label: '🚴 Cycling' },
  { value: 'SWIMMING', label: '🏊 Swimming' },
  { value: 'STRENGTH', label: '🏋️ Strength' },
  { value: 'YOGA', label: '🧘 Yoga' },
  { value: 'OTHER', label: '🎯 Other' },
];

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
  sportType: SportType;
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
  Record<'title' | 'startDate' | 'endDate' | 'endTime' | 'repeatInterval', string>
>;

export const EMPTY_FORM_VALUES: EventFormValues = {
  title: '',
  sportType: 'RUNNING',
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sportType: form.sportType,
    description: form.description.trim() || null,
    location: form.location.trim() || null,
  };
}

export type EventFormModalProps = {
  title: string;
  submitLabel: string;
  initialValues: EventFormValues;
  showRepeat?: boolean;
  // Lets the user choose between the current occurrence and the whole series;
  // the repeat controls then only apply (and show) when the whole series is picked.
  showScope?: boolean;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onClose: () => void;
};

export function EventFormModal({
  title,
  submitLabel,
  initialValues,
  showRepeat = false,
  showScope = false,
  onSubmit,
  onClose,
}: EventFormModalProps) {
  const [form, setForm] = useState<EventFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const repeatVisible = showRepeat && (!showScope || form.scope === 'ALL_EVENTS');

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
          <TextInput
            label="✏️ Title"
            required
            value={form.title}
            error={errors.title}
            onChange={(value) => setField('title', value)}
          />

          <Select
            label="🏃 Sport"
            required
            value={form.sportType}
            options={SPORT_TYPE_OPTIONS}
            onChange={(value) => setField('sportType', value as SportType)}
          />

          <Checkbox
            label="🗓️ All day"
            checked={form.allDay}
            onChange={(checked) => setField('allDay', checked)}
          />

          <div className={styles.row}>
            <DateTimeInput
              label="📅 Start date"
              type="date"
              required
              value={form.startDate}
              error={errors.startDate}
              onChange={(value) => setField('startDate', value)}
            />
            <DateTimeInput
              label="📆 End date"
              type="date"
              required
              value={form.endDate}
              error={errors.endDate}
              onChange={(value) => setField('endDate', value)}
            />
          </div>

          {!form.allDay ? (
            <div className={styles.row}>
              <DateTimeInput
                label="⏰ Start time"
                type="time"
                value={form.startTime}
                onChange={(value) => setField('startTime', value)}
              />
              <DateTimeInput
                label="⏱️ End time"
                type="time"
                value={form.endTime}
                error={errors.endTime}
                onChange={(value) => setField('endTime', value)}
              />
            </div>
          ) : null}

          {showScope ? (
            <Checkbox
              label="🔁 Update this and future events"
              checked={form.scope === 'ALL_EVENTS'}
              onChange={(checked) => setField('scope', checked ? 'ALL_EVENTS' : 'THIS_EVENT')}
            />
          ) : null}

          {repeatVisible ? (
            <>
              <Select
                label="🔁 Repeat"
                value={form.repeatFrequency}
                options={REPEAT_FREQUENCY_OPTIONS}
                onChange={(value) => setField('repeatFrequency', value as RepeatFrequency)}
              />

              {form.repeatFrequency ? (
                <div className={styles.intervalRow}>
                  <TextInput
                    label="🔢 Every"
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
            </>
          ) : null}

          <TextInput
            label="📍 Location"
            value={form.location}
            onChange={(value) => setField('location', value)}
          />

          <Textarea
            label="📝 Description"
            value={form.description}
            onChange={(value) => setField('description', value)}
          />

          <div className={styles.actions}>
            <Button type="button" label="Cancel" outlined onClick={onClose} />
            <Button type="submit" label={submitLabel} isLoading={submitting} />
          </div>
        </form>
      </Modal>
      {apiError ? (
        <Toast message={apiError} variant="error" onClose={() => setApiError(null)} />
      ) : null}
    </>
  );
}
