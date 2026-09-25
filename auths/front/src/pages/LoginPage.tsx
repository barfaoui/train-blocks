import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@common/components/Button';
import { TextInput } from '@common/components/TextInput';
import { useZodForm } from '@common/components/useZodForm';
import { TypographyLarge, TypographyMedium, TypographySmall } from '@common/styles/Typography';
import { DEFAULT_ERROR_MESSAGE } from '@common/utils/error-message.util';

import styles from './LoginPage.module.scss';
import { useSession } from '../auth/session';
import { signInBody, signUpForm } from '../auth/validation';
import { AuthApiError } from '../types/error';

type Tab = 'sign-in' | 'sign-up';

type TabButtonProps = {
  value: Tab;
  selected: Tab;
  onChange: (tab: Tab) => void;
  children: string;
};

function TabButton({ value, selected, onChange, children }: TabButtonProps) {
  const isSelected = value === selected;

  return (
    <TypographySmall
      as="button"
      type="button"
      role="tab"
      id={`auth-tab-${value}`}
      variant={isSelected ? 'bold' : 'normal'}
      className={[styles.tab, isSelected ? styles['-selected'] : undefined]
        .filter(Boolean)
        .join(' ')}
      aria-selected={isSelected}
      aria-controls={`auth-panel-${value}`}
      onClick={() => onChange(value)}
    >
      {children}
    </TypographySmall>
  );
}

type AuthTabsProps = {
  tab: Tab;
  onChange: (tab: Tab) => void;
};

function AuthTabs({ tab, onChange }: AuthTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Authentication">
      <TabButton value="sign-in" selected={tab} onChange={onChange}>
        Sign in
      </TabButton>
      <TabButton value="sign-up" selected={tab} onChange={onChange}>
        Sign up
      </TabButton>
      <span
        className={[styles.indicator, tab === 'sign-up' ? styles['-end'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      />
    </div>
  );
}

function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const { login } = useSession();
  const form = useZodForm(signInBody, { username: '', password: '' });
  const [submitError, setSubmitError] = useState<string>();

  return (
    <form
      className={styles.form}
      id="auth-panel-sign-in"
      role="tabpanel"
      aria-labelledby="auth-tab-sign-in"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setSubmitError(undefined);
        try {
          await login(values.username, values.password);
        } catch (error) {
          setSubmitError(submitMessage(error, form.applyServerErrors));
        }
      })}
    >
      <TextInput
        label="Username"
        name="username"
        autoComplete="username"
        required
        value={form.values.username}
        error={form.fieldError('username')}
        onChange={(value) => form.setField('username', value)}
        onBlur={() => form.touchField('username')}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={form.values.password}
        error={form.fieldError('password')}
        onChange={(value) => form.setField('password', value)}
        onBlur={() => form.touchField('password')}
      />
      <TypographySmall
        as={Link}
        to="/forgot-password"
        state={{ username: form.values.username }}
        className={styles.forgotLink}
      >
        Forgot password?
      </TypographySmall>
      <FormError message={submitError} />
      <Button
        type="submit"
        label="Sign in"
        fillHorizontally
        disabled={!form.isValid}
        isLoading={form.submitting}
      />
      <SwitchPrompt
        prompt="Don't have an account yet?"
        actionLabel="Sign up"
        onAction={onSwitchToSignUp}
      />
    </form>
  );
}

function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const { register } = useSession();
  const form = useZodForm(signUpForm, { username: '', password: '', confirmPassword: '' });
  const [submitError, setSubmitError] = useState<string>();

  return (
    <form
      className={styles.form}
      id="auth-panel-sign-up"
      role="tabpanel"
      aria-labelledby="auth-tab-sign-up"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setSubmitError(undefined);
        try {
          await register(values.username, values.password);
        } catch (error) {
          setSubmitError(submitMessage(error, form.applyServerErrors));
        }
      })}
    >
      <TextInput
        label="Username"
        name="username"
        autoComplete="username"
        required
        helperText="3–32 characters. Letters, numbers, and underscores."
        value={form.values.username}
        error={form.fieldError('username')}
        onChange={(value) => form.setField('username', value)}
        onBlur={() => form.touchField('username')}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        helperText="At least 8 characters, with uppercase, lowercase, a number, and a special character."
        value={form.values.password}
        error={form.fieldError('password')}
        onChange={(value) => form.setField('password', value)}
        onBlur={() => form.touchField('password')}
      />
      <TextInput
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={form.values.confirmPassword}
        error={form.fieldError('confirmPassword')}
        onChange={(value) => form.setField('confirmPassword', value)}
        onBlur={() => form.touchField('confirmPassword')}
      />
      <FormError message={submitError} />
      <Button
        type="submit"
        label="Sign up"
        fillHorizontally
        disabled={!form.isValid}
        isLoading={form.submitting}
      />
      <SwitchPrompt
        prompt="Already have an account?"
        actionLabel="Sign in"
        onAction={onSwitchToSignIn}
      />
    </form>
  );
}

function submitMessage(
  error: unknown,
  applyServerErrors: (errors: Record<string, string>) => void,
): string | undefined {
  if (error instanceof AuthApiError) {
    applyServerErrors(error.fieldErrors);
    return Object.keys(error.fieldErrors).length > 0 ? undefined : error.message;
  }
  return DEFAULT_ERROR_MESSAGE;
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <TypographySmall as="p" className={styles.formError} role="alert">
      {message}
    </TypographySmall>
  );
}

type SwitchPromptProps = {
  prompt: string;
  actionLabel: string;
  onAction: () => void;
};

function SwitchPrompt({ prompt, actionLabel, onAction }: SwitchPromptProps) {
  return (
    <TypographySmall as="p" className={styles.switchPrompt}>
      {prompt}{' '}
      <TypographySmall as="button" type="button" className={styles.switchLink} onClick={onAction}>
        {actionLabel}
      </TypographySmall>
    </TypographySmall>
  );
}

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('sign-in');

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <TypographyLarge as="h1" variant="bold" className={styles.title}>
            Train Blocks
          </TypographyLarge>
          <TypographyMedium as="p" className={styles.tagline}>
            Plan your training sessions, and sync them with your other apps and calendars.
          </TypographyMedium>
        </header>
        <AuthTabs tab={tab} onChange={setTab} />
        {tab === 'sign-in' ? (
          <SignInForm onSwitchToSignUp={() => setTab('sign-up')} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setTab('sign-in')} />
        )}
      </div>
    </main>
  );
}
