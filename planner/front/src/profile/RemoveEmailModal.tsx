import { useState } from 'react';

import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { Modal } from '@common/components/Modal';
import { TypographyMedium } from '@common/styles/Typography';

import styles from './RemoveEmailModal.module.scss';
import { useSession } from '../auth/session';

export type RemoveEmailModalProps = {
  email: string;
  onClose: () => void;
};

export function RemoveEmailModal({ email, onClose }: RemoveEmailModalProps) {
  const { removeEmail } = useSession();
  const { reportError, showToast } = useErrorReporter();
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    setSubmitting(true);
    try {
      await removeEmail();
      showToast('Your email address was removed.', 'success');
      onClose();
    } catch (error) {
      reportError(error);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Remove email address"
      onClose={submitting ? () => {} : onClose}
      className={styles.modal}
    >
      <div className={styles.content}>
        <TypographyMedium>
          Remove <strong>{email}</strong> from your account?
        </TypographyMedium>
        <TypographyMedium>
          You won't get email notifications any more, and you won't be able to use this address to
          get back into your account. You can add an address again at any time.
        </TypographyMedium>
        <div className={styles.actions}>
          <Button label="Cancel" style="small" outlined onClick={onClose} />
          <Button
            label="Remove email"
            variant="dangerous"
            style="small"
            isLoading={submitting}
            onClick={() => void handleRemove()}
          />
        </div>
      </div>
    </Modal>
  );
}
