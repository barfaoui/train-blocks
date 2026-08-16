import { type FormEvent, useState } from 'react';

import { Button } from '@common/styles/Button';
import { TextInput } from '@common/styles/TextInput';
import { TypographySmall } from '@common/styles/Typography';

import styles from './LoginPage.module.scss';

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
      <div className={styles.tabs} role="tablist" aria-label="Authentication">
        <TypographySmall
          as="button"
          type="button"
          role="tab"
          id="auth-tab-sign-in"
          variant={tab === 'sign-in' ? 'bold' : 'normal'}
          className={[styles.tab, tab === 'sign-in' ? styles['-selected'] : undefined]
            .filter(Boolean)
            .join(' ')}
          aria-selected={tab === 'sign-in'}
          aria-controls="auth-panel-sign-in"
          onClick={() => setTab('sign-in')}
        >
          Sign in
        </TypographySmall>
        <TypographySmall
          as="button"
          type="button"
          role="tab"
          id="auth-tab-sign-up"
          variant={tab === 'sign-up' ? 'bold' : 'normal'}
          className={[styles.tab, tab === 'sign-up' ? styles['-selected'] : undefined]
            .filter(Boolean)
            .join(' ')}
          aria-selected={tab === 'sign-up'}
          aria-controls="auth-panel-sign-up"
          onClick={() => setTab('sign-up')}
        >
          Sign up
        </TypographySmall>
        <span
          className={[styles.indicator, tab === 'sign-up' ? styles['-end'] : undefined]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        />
      </div>
      {tab === 'sign-in' ? (
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
            value={signInUsername}
            onChange={setSignInUsername}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={signInPassword}
            onChange={setSignInPassword}
          />
          <Button type="submit" label="Sign in" fillHorizontally />
        </form>
      ) : (
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
            value={signUpUsername}
            onChange={setSignUpUsername}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            helperText="At least 8 characters"
            value={signUpPassword}
            onChange={setSignUpPassword}
          />
          <TextInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={signUpConfirmPassword}
            onChange={setSignUpConfirmPassword}
          />
          <Button type="submit" label="Sign up" fillHorizontally />
        </form>
      )}
    </main>
  );
}
