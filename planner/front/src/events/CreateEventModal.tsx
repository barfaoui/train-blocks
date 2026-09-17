import { type FormEvent, useState } from 'react';

import { Button } from '@common/components/Button';
import { Checkbox } from '@common/components/Checkbox';
import { DateTimeInput } from '@common/components/DateTimeInput';
import { Modal } from '@common/components/Modal';
import { Select } from '@common/components/Select';
import { Textarea } from '@common/components/Textarea';
import { TextInput } from '@common/components/TextInput';
import { Toast } from '@common/components/Toast';
import type { CreateEventBody, SportType } from '@common/planner-types';
import { TypographySmall } from '@common/styles/Typography';

import styles from './CreateEventModal.module.scss';
import { createEvent } from './events-service';

const SPORT_TYPE_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'RUNNING', label: '🏃 Running' },
  { value: 'CYCLING', label: '🚴 Cycling' },
  { value: 'SWIMMING', label: '🏊 Swimming' },
  { value: 'STRENGTH', label: '🏋️ Strength' },
  { value: 'YOGA', label: '🧘 Yoga' },
  { value: 'OTHER', label: '🎯 Other' },
];

type RepeatFrequency = '' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

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

type FormState = {
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
};

type FieldErrors = Partial<
  Record<'title' | 'startDate' | 'endDate' | 'endTime' | 'repeatInterval', string>
>;

export type CreateEventModalProps = {
  initialDate: string;
  initialTime?: string;
  onClose: () => void;
  onCreated: () => void;
};

// Caps at 23:59 rather than rolling into the next day, since the form treats
// a single click as a same-day block.
function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = Math.min(hours * 60 + minutes + 60, 23 * 60 + 59);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

function initialFormState(initialDate: string, initialTime?: string): FormState {
  return {
    title: '',
    sportType: 'RUNNING',
    allDay: !initialTime,
    startDate: initialDate,
    endDate: initialDate,
    startTime: initialTime ?? '',
    endTime: initialTime ? addOneHour(initialTime) : '',
    location: '',
    description: '',
    repeatFrequency: '',
    repeatInterval: '1',
    repeatWeekdays: [],
  };
}

function validate(form: FormState): FieldErrors {
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
  if (form.repeatFrequency) {
    const interval = Number(form.repeatInterval);
    if (!Number.isInteger(interval) || interval < 1) {
      errors.repeatInterval = 'Enter a whole number of 1 or more';
    }
  }

  return errors;
}

function buildRecurrenceRule(form: FormState): string | null {
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

function toRequestBody(form: FormState): CreateEventBody {
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
    recurrenceRule: buildRecurrenceRule(form),
  };
}

export function CreateEventModal({
  initialDate,
  initialTime,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  const [form, setForm] = useState<FormState>(() => initialFormState(initialDate, initialTime));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await createEvent(toRequestBody(form));
      onCreated();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal title="✨ New event" onClose={onClose}>
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
                    className={[styles.weekdayButton, selected ? styles['-selected'] : undefined]
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

          <div className={styles.actions}>
            <Button type="button" label="Cancel" outlined onClick={onClose} />
            <Button type="submit" label="Create event" isLoading={submitting} />
          </div>
        </form>
      </Modal>
      {apiError ? (
        <Toast message={apiError} variant="error" onClose={() => setApiError(null)} />
      ) : null}
    </>
  );
}
