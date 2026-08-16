import { Link } from 'react-router-dom';

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
        <dt>Created at</dt>
        <dd>{user?.createdAt ? formatCreatedAt(user.createdAt) : '—'}</dd>
      </dl>
      <p>
        <Link to="/">Home</Link>
      </p>
      <Button type="button" label="Sign out" onClick={() => void logout()} />
    </main>
  );
}

// TODO: Have a prettyDate util/ pipe
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString();
}
