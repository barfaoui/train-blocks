import { resetPasswordForm } from '@common/auth-validation';
import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { Modal } from '@common/components/Modal';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';
import { TypographySmall } from '@common/styles/Typography';

import styles from './ResetPasswordModal.module.scss';
import { AuthsRequestError, changePassword } from '../auth/auths-service';

export type ResetPasswordModalProps = {
  onClose: () => void;
};

export function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const { reportError, showToast } = useErrorReporter();
  const form = useZodForm(resetPasswordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  return (
    <Modal title="Reset password" onClose={form.submitting ? () => {} : onClose}>
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(async ({ currentPassword, newPassword }) => {
          try {
            await changePassword({ currentPassword, newPassword });
            showToast('Your password was changed. Your other devices were signed out.', 'success');
            onClose();
          } catch (error) {
            if (error instanceof AuthsRequestError && Object.keys(error.fieldErrors).length > 0) {
              form.applyServerErrors(error.fieldErrors);
            } else {
              reportError(error);
            }
          }
        })}
      >
        <TypographySmall as="p" className={styles.intro}>
          Changing your password signs you out on your other devices.
        </TypographySmall>
        <TextInput
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={form.values.currentPassword}
          error={form.fieldError('currentPassword')}
          onChange={(value) => form.setField('currentPassword', value)}
          onBlur={() => form.touchField('currentPassword')}
        />
        <TextInput
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          helperText="At least 8 characters, with upper and lower case letters, a number and a special character."
          value={form.values.newPassword}
          error={form.fieldError('newPassword')}
          onChange={(value) => form.setField('newPassword', value)}
          onBlur={() => form.touchField('newPassword')}
        />
        <TextInput
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={form.values.confirmPassword}
          error={form.fieldError('confirmPassword')}
          onChange={(value) => form.setField('confirmPassword', value)}
          onBlur={() => form.touchField('confirmPassword')}
        />
        <div className={styles.actions}>
          <Button type="button" style="small" outlined label="Cancel" onClick={onClose} />
          <Button type="submit" style="small" label="Reset password" isLoading={form.submitting} />
        </div>
      </form>
    </Modal>
  );
}
