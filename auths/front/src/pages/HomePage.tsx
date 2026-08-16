import { Link } from 'react-router-dom';

import { Button } from '@common/components/Button';

import { useSession } from '../auth/session';

export function HomePage() {
  const { status, user, logout } = useSession();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated' && user) {
    return (
      <main>
        <p>Hi {user.username}!</p>
        <p>
          <Link to="/profile">Profile</Link>
        </p>
        <Button type="button" label="Sign out" onClick={() => void logout()} />
      </main>
    );
  }

  return (
    <main>
      <p>Hi there!</p>
      <p>
        <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
