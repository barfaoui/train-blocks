import { useState } from 'react';

import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { Modal } from '@common/components/Modal';
import type { EventDeleteScope, PlannerEvent } from '@common/planner-types';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './DeleteEventModal.module.scss';
import { deleteEvent } from './events-service';

const SCOPE_OPTIONS: { value: EventDeleteScope; label: string }[] = [
  { value: 'THIS_EVENT', label: 'This event only' },
  { value: 'THIS_AND_FUTURE_EVENTS', label: 'This and future events' },
  { value: 'ALL_EVENTS', label: 'All events' },
];

export type DeleteEventModalProps = {
  event: PlannerEvent;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteEventModal({ event, onClose, onDeleted }: DeleteEventModalProps) {
  const { reportError } = useErrorReporter();
  const isRecurring = event.seriesId !== null;
  const [scope, setScope] = useState<EventDeleteScope>('THIS_EVENT');
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteEvent(event.id, isRecurring ? scope : 'THIS_EVENT');
      onDeleted();
    } catch (err) {
      reportError(err);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="🗑️ Delete event"
      onClose={submitting ? () => {} : onClose}
      className={styles.modal}
    >
      <div className={styles.content}>
        <TypographyMedium>Would you like to delete this event : {event.title}?</TypographyMedium>
        {isRecurring ? (
          <fieldset className={styles.scopeGroup}>
            <legend className={styles.legend}>Events to delete</legend>
            {SCOPE_OPTIONS.map((option) => (
              <label key={option.value} className={styles.scopeOption}>
                <input
                  type="radio"
                  name="delete-scope"
                  className={styles.radio}
                  value={option.value}
                  checked={scope === option.value}
                  onChange={() => setScope(option.value)}
                />
                <TypographySmall>{option.label}</TypographySmall>
              </label>
            ))}
          </fieldset>
        ) : null}
        <div className={styles.actions}>
          <Button label="Cancel" variant="primary" style="small" outlined onClick={onClose} />
          <Button
            label="Delete"
            variant="dangerous"
            style="small"
            isLoading={submitting}
            onClick={() => void handleDelete()}
          />
        </div>
      </div>
    </Modal>
  );
}
