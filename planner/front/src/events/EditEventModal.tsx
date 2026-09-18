import { type FormEvent, useState } from 'react';

import { Button } from '@common/components/Button';
import { Checkbox } from '@common/components/Checkbox';
import { DateTimeInput } from '@common/components/DateTimeInput';
import { Modal } from '@common/components/Modal';
import { Select } from '@common/components/Select';
import { Textarea } from '@common/components/Textarea';
import { TextInput } from '@common/components/TextInput';
import { Toast } from '@common/components/Toast';
import type {
  EventEditScope,
  PlannerEvent,
  SportType,
  UpdateEventBody,
} from '@common/planner-types';

import styles from './EditEventModal.module.scss';
import { updateEvent } from './events-service';

const SPORT_TYPE_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'RUNNING', label: '🏃 Running' },
  { value: 'CYCLING', label: '🚴 Cycling' },
  { value: 'SWIMMING', label: '🏊 Swimming' },
  { value: 'STRENGTH', label: '🏋️ Strength' },
  { value: 'YOGA', label: '🧘 Yoga' },
  { value: 'OTHER', label: '🎯 Other' },
];

const EDIT_SCOPE_OPTIONS: { value: EventEditScope; label: string }[] = [
  { value: 'THIS_EVENT', label: 'This event' },
  { value: 'ALL_EVENTS', label: 'All events in the series' },
];

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
  scope: EventEditScope;
};

type FieldErrors = Partial<Record<'title' | 'startDate' | 'endDate' | 'endTime', string>>;

export type EditEventModalProps = {
  event: PlannerEvent;
  onClose: () => void;
  onUpdated: () => void;
};

function initialFormState(event: PlannerEvent): FormState {
  return {
    title: event.title,
    sportType: event.sportType,
    allDay: !event.startTime,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime?.slice(0, 5) ?? '',
    endTime: event.endTime?.slice(0, 5) ?? '',
    location: event.location ?? '',
    description: event.description ?? '',
    scope: 'THIS_EVENT',
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

  return errors;
}

function toRequestBody(form: FormState): UpdateEventBody {
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
    scope: form.scope,
  };
}

export function EditEventModal({ event, onClose, onUpdated }: EditEventModalProps) {
  const [form, setForm] = useState<FormState>(() => initialFormState(event));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isRecurring = event.seriesId !== null;

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await updateEvent(event.id, toRequestBody(form));
      onUpdated();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal title="✏️ Edit event" onClose={onClose}>
        <form className={styles.form} onSubmit={(formEvent) => void handleSubmit(formEvent)}>
          {isRecurring ? (
            <Select
              label="🔁 Apply to"
              value={form.scope}
              options={EDIT_SCOPE_OPTIONS}
              onChange={(value) => setField('scope', value as EventEditScope)}
            />
          ) : null}

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

          <div className={styles.actions}>
            <Button type="button" label="Cancel" outlined onClick={onClose} />
            <Button type="submit" label="Save changes" isLoading={submitting} />
          </div>
        </form>
      </Modal>
      {apiError ? (
        <Toast message={apiError} variant="error" onClose={() => setApiError(null)} />
      ) : null}
    </>
  );
}
