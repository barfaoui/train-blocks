import { addMinutesToTime } from '@common/utils/time.util';

import {
  EMPTY_FORM_VALUES,
  EventFormModal,
  type EventFormValues,
  buildRecurrenceRule,
  toEventFields,
} from './EventFormModal';
import { createEvent } from './events-service';
import { useSession } from '../auth/session';

const FALLBACK_DURATION_MIN = 60;

export type CreateEventModalProps = {
  initialDate: string;
  initialTime?: string;
  onClose: () => void;
  onCreated: () => void;
};

function initialValues(
  initialDate: string,
  durationMin: number,
  initialTime?: string,
): EventFormValues {
  return {
    ...EMPTY_FORM_VALUES,
    allDay: !initialTime,
    startDate: initialDate,
    endDate: initialDate,
    startTime: initialTime ?? '',
    endTime: initialTime ? addMinutesToTime(initialTime, durationMin) : '',
  };
}

export function CreateEventModal({
  initialDate,
  initialTime,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  const { user } = useSession();
  const durationMin = user?.preferences?.defaultEventDurationMin ?? FALLBACK_DURATION_MIN;

  return (
    <EventFormModal
      title="✨ New event"
      submitLabel="Create event"
      initialValues={initialValues(initialDate, durationMin, initialTime)}
      defaultDurationMin={durationMin}
      showRepeat
      onClose={onClose}
      onSubmit={async (form) => {
        await createEvent({ ...toEventFields(form), recurrenceRule: buildRecurrenceRule(form) });
        onCreated();
      }}
    />
  );
}
