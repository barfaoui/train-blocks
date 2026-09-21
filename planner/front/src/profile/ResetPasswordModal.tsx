import { resetPasswordForm } from '@common/auth-validation';
import { Button } from '@common/components/Button';
import { Modal } from '@common/components/Modal';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';

import styles from './ResetPasswordModal.module.scss';

export type ResetPasswordModalProps = {
  onClose: () => void;
};

export function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const form = useZodForm(resetPasswordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  return (
    <Modal title="Reset password" onClose={onClose}>
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(() => {
          // TODO: send the new password to the auths service once the endpoint exists.
        })}
      >
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
