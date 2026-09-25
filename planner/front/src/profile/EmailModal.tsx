import { setEmailBody } from '@common/auth-validation';
import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { Modal } from '@common/components/Modal';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';
import { TypographySmall } from '@common/styles/Typography';

import styles from './EmailModal.module.scss';
import { useSession } from '../auth/session';

export type EmailModalProps = {
  currentEmail: string | null;
  onClose: () => void;
};

export function EmailModal({ currentEmail, onClose }: EmailModalProps) {
  const { setEmail } = useSession();
  const { reportError, showToast } = useErrorReporter();
  const form = useZodForm(setEmailBody, { email: currentEmail ?? '' });

  return (
    <Modal
      title={currentEmail ? 'Change email address' : 'Add an email address'}
      onClose={form.submitting ? () => {} : onClose}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(async ({ email }) => {
          try {
            await setEmail(email);
            showToast(`We sent a verification link to ${email}.`, 'success');
            onClose();
          } catch (error) {
            reportError(error);
          }
        })}
      >
        <TypographySmall as="p" className={styles.intro}>
          We'll email you a link to confirm the address.
          {currentEmail
            ? ' Until you open it, your account shows the new address as not verified.'
            : null}
        </TypographySmall>
        <TextInput
          label="Email address"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={form.values.email}
          error={form.fieldError('email')}
          onChange={(value) => form.setField('email', value)}
          onBlur={() => form.touchField('email')}
        />
        <div className={styles.actions}>
          <Button type="button" style="small" outlined label="Cancel" onClick={onClose} />
          <Button
            type="submit"
            style="small"
            label="Send verification link"
            isLoading={form.submitting}
          />
        </div>
      </form>
    </Modal>
  );
}
