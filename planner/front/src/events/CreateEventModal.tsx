import {
  EMPTY_FORM_VALUES,
  EventFormModal,
  type EventFormValues,
  buildRecurrenceRule,
  toEventFields,
} from './EventFormModal';
import { createEvent } from './events-service';

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

function initialValues(initialDate: string, initialTime?: string): EventFormValues {
  return {
    ...EMPTY_FORM_VALUES,
    allDay: !initialTime,
    startDate: initialDate,
    endDate: initialDate,
    startTime: initialTime ?? '',
    endTime: initialTime ? addOneHour(initialTime) : '',
  };
}

export function CreateEventModal({
  initialDate,
  initialTime,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  return (
    <EventFormModal
      title="✨ New event"
      submitLabel="Create event"
      initialValues={initialValues(initialDate, initialTime)}
      showRepeat
      onClose={onClose}
      onSubmit={async (form) => {
        await createEvent({ ...toEventFields(form), recurrenceRule: buildRecurrenceRule(form) });
        onCreated();
      }}
    />
  );
}
