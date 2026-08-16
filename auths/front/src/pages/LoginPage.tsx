import { type FormEvent, useState } from 'react';

import { Button } from '@common/styles/Button';
import { TextInput } from '@common/styles/TextInput';
import { TypographySmall } from '@common/styles/Typography';

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

function SignInForm() {
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
    </form>
  );
}

function SignUpForm() {
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
        value={username}
        onChange={setUsername}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        helperText="At least 8 characters"
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
    </form>
  );
}

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('sign-in');

  return (
    <main className={styles.page}>
      <h1>Auths</h1>
      <AuthTabs tab={tab} onChange={setTab} />
      {tab === 'sign-in' ? <SignInForm /> : <SignUpForm />}
    </main>
  );
}
