import type { PlannerEvent } from '@common/planner-types';

import {
  EMPTY_FORM_VALUES,
  EventFormModal,
  type EventFormValues,
  buildRecurrenceRule,
  parseRecurrenceRule,
  toEventFields,
} from './EventFormModal';
import { updateEvent } from './events-service';

export type EditEventModalProps = {
  event: PlannerEvent;
  onClose: () => void;
  onUpdated: () => void;
};

function initialValues(event: PlannerEvent): EventFormValues {
  return {
    ...EMPTY_FORM_VALUES,
    title: event.title,
    sportType: event.sportType,
    allDay: !event.startTime,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime?.slice(0, 5) ?? '',
    endTime: event.endTime?.slice(0, 5) ?? '',
    location: event.location ?? '',
    description: event.description ?? '',
    ...parseRecurrenceRule(event.recurrenceRule),
  };
}

function repeatSignature(form: EventFormValues): string {
  return [
    form.repeatFrequency,
    form.repeatInterval,
    [...form.repeatWeekdays].sort().join(','),
  ].join('|');
}

export function EditEventModal({ event, onClose, onUpdated }: EditEventModalProps) {
  const isRecurring = event.seriesId !== null;
  const initial = initialValues(event);

  return (
    <EventFormModal
      title="✏️ Edit event"
      submitLabel="Save changes"
      initialValues={initial}
      showRepeat
      showScope={isRecurring}
      onClose={onClose}
      onSubmit={async (form) => {
        // Only send a rule when the repeat controls were changed, so a rule with
        // parts the form can't represent (e.g. COUNT) isn't silently rewritten.
        const repeatApplies = !isRecurring || form.scope === 'ALL_EVENTS';
        const repeatChanged = repeatSignature(form) !== repeatSignature(initial);

        await updateEvent(event.id, {
          ...toEventFields(form),
          scope: form.scope,
          ...(repeatApplies && repeatChanged ? { recurrenceRule: buildRecurrenceRule(form) } : {}),
        });
        onUpdated();
      }}
    />
  );
}
