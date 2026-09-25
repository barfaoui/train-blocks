import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { ForgotPasswordResult } from '@common/auth-types';
import { forgotPasswordBody } from '@common/auth-validation';
import { Button } from '@common/components/Button';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';
import { TypographyLarge, TypographyMedium, TypographySmall } from '@common/styles/Typography';
import { DEFAULT_ERROR_MESSAGE } from '@common/utils/error-message.util';

import styles from './LoginPage.module.scss';
import passwordStyles from './PasswordPage.module.scss';
import { requestPasswordReset } from '../auth/auths-service';
import { AuthApiError } from '../types/error';

const SUPPORT_EMAIL = 'b.arfaoui@pm.me';

function Result({ result }: { result: ForgotPasswordResult }) {
  if (result.status === 'sent') {
    return (
      <div className={passwordStyles.notice} role="status">
        <TypographyMedium as="p" variant="bold" className={passwordStyles.noticeTitle}>
          Check your inbox
        </TypographyMedium>
        <TypographySmall as="p" className={passwordStyles.noticeText}>
          We sent a link to <strong>{result.email}</strong> to choose a new password. It expires in
          1 hour.
        </TypographySmall>
      </div>
    );
  }

  return (
    <div className={[passwordStyles.notice, passwordStyles['-warning']].join(' ')} role="status">
      <TypographyMedium as="p" variant="bold" className={passwordStyles.noticeTitle}>
        We're sorry
      </TypographyMedium>
      <TypographySmall as="p" className={passwordStyles.noticeText}>
        You don't have a verified email address associated with your account, so we can't send you a
        reset link. Try contacting{' '}
        <a className={passwordStyles.inlineLink} href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>{' '}
        for help, and we'll see what we can do for you.
      </TypographySmall>
    </div>
  );
}

export function ForgotPasswordPage() {
  const location = useLocation();
  // Carried over from the sign-in form, so the user doesn't type it twice.
  const initialUsername = (location.state as { username?: string } | null)?.username ?? '';
  const form = useZodForm(forgotPasswordBody, { username: initialUsername });
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const [submitError, setSubmitError] = useState<string>();

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <TypographyLarge as="h1" variant="bold" className={styles.title}>
            Forgot your password?
          </TypographyLarge>
        </header>
        <div className={styles.form}>
          {result ? (
            <Result result={result} />
          ) : (
            <form
              className={styles.form}
              noValidate
              onSubmit={form.handleSubmit(async ({ username }) => {
                setSubmitError(undefined);
                try {
                  setResult(await requestPasswordReset(username));
                } catch (error) {
                  if (error instanceof AuthApiError) {
                    form.applyServerErrors(error.fieldErrors);
                    setSubmitError(
                      Object.keys(error.fieldErrors).length > 0 ? undefined : error.message,
                    );
                  } else {
                    setSubmitError(DEFAULT_ERROR_MESSAGE);
                  }
                }
              })}
            >
              <TypographySmall as="p" className={passwordStyles.intro}>
                Enter your username. If your account has a verified email address, we'll send you a
                link to choose a new password.
              </TypographySmall>
              <TextInput
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                value={form.values.username}
                error={form.fieldError('username')}
                onChange={(value) => form.setField('username', value)}
                onBlur={() => form.touchField('username')}
              />
              {submitError ? (
                <TypographySmall as="p" className={styles.formError} role="alert">
                  {submitError}
                </TypographySmall>
              ) : null}
              <Button
                type="submit"
                label="Send reset link"
                fillHorizontally
                disabled={!form.isValid}
                isLoading={form.submitting}
              />
            </form>
          )}
          <TypographySmall as={Link} to="/" className={passwordStyles.backLink}>
            Back to sign in
          </TypographySmall>
        </div>
      </div>
    </main>
  );
}
