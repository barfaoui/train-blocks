import { Fragment } from 'react';

import { Button } from '@common/components/Button';

import { useSession } from '../auth/session';

export function ProfilePage() {
  const { user, logout } = useSession();

  return (
    <main>
      <h1>Profile</h1>
      <dl>
        <dt>Username</dt>
        <dd>{user?.username ?? '—'}</dd>
        <dt>Email</dt>
        <dd>{user?.email ?? '—'}</dd>
        <dt>Email verified at</dt>
        <dd>{user?.emailVerifiedAt ? formatCreatedAt(user.emailVerifiedAt) : '—'}</dd>
        <dt>Display name</dt>
        <dd>{user?.displayName ?? '—'}</dd>
        <dt>Avatar icon</dt>
        <dd>{user?.avatarIcon ?? '—'}</dd>
        <dt>Avatar color</dt>
        <dd>{user?.avatarColor ?? '—'}</dd>
        <dt>Created at</dt>
        <dd>{user?.createdAt ? formatCreatedAt(user.createdAt) : '—'}</dd>
      </dl>
      <h2>Preferences</h2>
      <dl>
        {Object.entries(user?.preferences ?? {}).map(([key, value]) => (
          <Fragment key={key}>
            <dt>{key}</dt>
            <dd>{formatPreferenceValue(value)}</dd>
          </Fragment>
        ))}
      </dl>
      <Button type="button" label="Sign out" onClick={() => void logout()} />
    </main>
  );
}

function formatPreferenceValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  return String(value);
}

// TODO: Have a prettyDate util/ pipe
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString();
}
