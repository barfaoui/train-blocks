import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { newPasswordForm } from '@common/auth-validation';
import { Button } from '@common/components/Button';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';
import { TypographyLarge, TypographyMedium, TypographySmall } from '@common/styles/Typography';
import { DEFAULT_ERROR_MESSAGE } from '@common/utils/error-message.util';

import styles from './LoginPage.module.scss';
import passwordStyles from './PasswordPage.module.scss';
import { useSession } from '../auth/session';
import { AuthApiError } from '../types/error';

// Landing page for the link in the "reset your password" email. Not behind GuestGuard: a
// signed-in user can use the link too, and is signed out once the password changes.
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useSession();
  // Read once: the token is removed from the address bar right after.
  const [token] = useState(() => searchParams.get('token'));
  const form = useZodForm(newPasswordForm, { password: '', confirmPassword: '' });
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(
    token ? null : 'This password reset link is incomplete.',
  );
  const [submitError, setSubmitError] = useState<string>();

  // Keep the token out of the browser history.
  useEffect(() => {
    if (token) {
      navigate('/reset-password', { replace: true });
    }
  }, [token, navigate]);

  function content() {
    if (done) {
      return (
        <>
          <div className={passwordStyles.notice} role="status">
            <TypographyMedium as="p" variant="bold" className={passwordStyles.noticeTitle}>
              Password changed
            </TypographyMedium>
            <TypographySmall as="p" className={passwordStyles.noticeText}>
              Sign in with your new password. For your security, you were signed out on all your
              devices.
            </TypographySmall>
          </div>
          <Button label="Sign in" fillHorizontally onClick={() => navigate('/')} />
        </>
      );
    }

    if (linkError) {
      return (
        <>
          <div
            className={[passwordStyles.notice, passwordStyles['-warning']].join(' ')}
            role="alert"
          >
            <TypographySmall as="p" className={passwordStyles.noticeText}>
              {linkError} You can ask for a new one.
            </TypographySmall>
          </div>
          <Button
            label="Get a new link"
            fillHorizontally
            onClick={() => navigate('/forgot-password')}
          />
        </>
      );
    }

    return (
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(async ({ password }) => {
          setSubmitError(undefined);
          try {
            await resetPassword(token as string, password);
            setDone(true);
          } catch (error) {
            if (!(error instanceof AuthApiError)) {
              setSubmitError(DEFAULT_ERROR_MESSAGE);
            } else if (error.fieldErrors.password) {
              form.applyServerErrors({ password: error.fieldErrors.password });
            } else if (error.status === 400) {
              // Anything else the service rejects is the link itself: used, expired or mangled.
              setLinkError(error.fieldErrors.token ?? error.message);
            } else {
              setSubmitError(error.message);
            }
          }
        })}
      >
        <TypographySmall as="p" className={passwordStyles.intro}>
          Choose a new password. You'll be signed out on all your devices.
        </TypographySmall>
        <TextInput
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          helperText="At least 8 characters, with uppercase, lowercase, a number, and a special character."
          value={form.values.password}
          error={form.fieldError('password')}
          onChange={(value) => form.setField('password', value)}
          onBlur={() => form.touchField('password')}
        />
        <TextInput
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.values.confirmPassword}
          error={form.fieldError('confirmPassword')}
          onChange={(value) => form.setField('confirmPassword', value)}
          onBlur={() => form.touchField('confirmPassword')}
        />
        {submitError ? (
          <TypographySmall as="p" className={styles.formError} role="alert">
            {submitError}
          </TypographySmall>
        ) : null}
        <Button
          type="submit"
          label="Change password"
          fillHorizontally
          disabled={!form.isValid}
          isLoading={form.submitting}
        />
      </form>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <TypographyLarge as="h1" variant="bold" className={styles.title}>
            Choose a new password
          </TypographyLarge>
        </header>
        <div className={styles.form}>
          {content()}
          {done ? null : (
            <TypographySmall as={Link} to="/" className={passwordStyles.backLink}>
              Back to sign in
            </TypographySmall>
          )}
        </div>
      </div>
    </main>
  );
}
