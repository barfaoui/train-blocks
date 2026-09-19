import type { PlannerEvent } from '@common/planner-types';

import { initialValues } from './EditEventModal';
import { EventFormModal, buildRecurrenceRule, toEventFields } from './EventFormModal';
import { createEvent } from './events-service';

export type DuplicateEventModalProps = {
  event: PlannerEvent;
  onClose: () => void;
  onCreated: () => void;
};

// The copy is only created on submit, so dismissing the modal leaves nothing behind.
export function DuplicateEventModal({ event, onClose, onCreated }: DuplicateEventModalProps) {
  return (
    <EventFormModal
      title="📄 Duplicate event"
      submitLabel="Create event"
      initialValues={initialValues(event)}
      showRepeat
      onClose={onClose}
      onSubmit={async (form) => {
        await createEvent({
          ...toEventFields(form),
          planId: event.planId,
          recurrenceRule: buildRecurrenceRule(form),
        });
        onCreated();
      }}
    />
  );
}
