import { type FormEvent, useState } from 'react';

import { Button } from '@common/styles/Button';
import { TextInput } from '@common/styles/TextInput';
import { TypographyLarge, TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './LoginPage.module.scss';

type Tab = 'sign-in' | 'sign-up';

function preventSubmit(event: FormEvent) {
  event.preventDefault();
}

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className={styles.form}
      id="auth-panel-sign-in"
      role="tabpanel"
      aria-labelledby="auth-tab-sign-in"
      onSubmit={preventSubmit}
    >
      <TextInput
        label="Username"
        name="username"
        autoComplete="username"
        required
        value={username}
        onChange={setUsername}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={setPassword}
      />
      <Button type="submit" label="Sign in" fillHorizontally />
      <SwitchPrompt
        prompt="Don't have an account yet?"
        actionLabel="Sign up"
        onAction={onSwitchToSignUp}
      />
    </form>
  );
}

function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <form
      className={styles.form}
      id="auth-panel-sign-up"
      role="tabpanel"
      aria-labelledby="auth-tab-sign-up"
      onSubmit={preventSubmit}
    >
      <TextInput
        label="Username"
        name="username"
        autoComplete="username"
        required
        helperText="3–32 characters. Letters, numbers, and underscores."
        value={username}
        onChange={setUsername}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        helperText="At least 8 characters, with uppercase, lowercase, a number, and a special character."
        value={password}
        onChange={setPassword}
      />
      <TextInput
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      <Button type="submit" label="Sign up" fillHorizontally />
      <SwitchPrompt
        prompt="Already have an account?"
        actionLabel="Sign in"
        onAction={onSwitchToSignIn}
      />
    </form>
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
