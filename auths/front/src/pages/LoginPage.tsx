import { type FormEvent, useState } from 'react';

import { TextInput } from '@common/styles/TextInput';

import styles from './LoginPage.module.css';

type Tab = 'sign-in' | 'sign-up';

function preventSubmit(event: FormEvent) {
  event.preventDefault();
}

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('sign-in');
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  return (
    <main className={styles.page}>
      <h1>Auths</h1>
      <div role="tablist" aria-label="Authentication">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'sign-in'}
          onClick={() => setTab('sign-in')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'sign-up'}
          onClick={() => setTab('sign-up')}
        >
          Sign up
        </button>
      </div>
      {tab === 'sign-in' ? (
        <form className={styles.form} onSubmit={preventSubmit}>
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
            value={signInUsername}
            onChange={setSignInUsername}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={signInPassword}
            onChange={setSignInPassword}
          />
          <button type="submit">Sign in</button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={preventSubmit}>
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
            value={signUpUsername}
            onChange={setSignUpUsername}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={signUpPassword}
            onChange={setSignUpPassword}
          />
          <TextInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={signUpConfirmPassword}
            onChange={setSignUpConfirmPassword}
          />
          <button type="submit">Sign up</button>
        </form>
      )}
    </main>
  );
}
