import { useState } from 'react';

import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { Modal } from '@common/components/Modal';
import { TypographyMedium } from '@common/styles/Typography';

import styles from './DeleteAccountModal.module.scss';
import { useSession } from '../auth/session';

export type DeleteAccountModalProps = {
  onClose: () => void;
};

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const { deleteAccount } = useSession();
  const { reportError } = useErrorReporter();
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteAccount();
    } catch (error) {
      reportError(error);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="🗑️ Delete account"
      onClose={submitting ? () => {} : onClose}
      className={styles.modal}
    >
      <div className={styles.content}>
        <TypographyMedium>Are you sure you want to delete your account?</TypographyMedium>
        <TypographyMedium>
          You have 7 days: if you change your mind, contact{' '}
          <a href="mailto:b.arfaoui@pm.me">b.arfaoui@pm.me</a> to restore your account. After that,
          all your account and related data will be permanently removed.
        </TypographyMedium>
        <div className={styles.actions}>
          <Button label="Cancel" variant="primary" style="small" outlined onClick={onClose} />
          <Button
            label="Delete account"
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
