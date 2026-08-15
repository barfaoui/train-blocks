import { type FormEvent, useState } from 'react';

type Tab = 'sign-in' | 'sign-up';

function preventSubmit(event: FormEvent) {
  event.preventDefault();
}

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('sign-in');

  return (
    <main>
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
        <form onSubmit={preventSubmit}>
          <label>
            Username
            <input name="username" autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" />
          </label>
          <button type="submit">Sign in</button>
        </form>
      ) : (
        <form onSubmit={preventSubmit}>
          <label>
            Username
            <input name="username" autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" autoComplete="new-password" />
          </label>
          <button type="submit">Sign up</button>
        </form>
      )}
    </main>
  );
}
