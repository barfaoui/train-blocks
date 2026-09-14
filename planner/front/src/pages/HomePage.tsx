import { authsProfileHref } from '@common/app-urls';
import { Button } from '@common/components/Button';

import { useSession } from '../auth/session';
import { authsFrontBase } from '../auth/url-bases';
import { Calendar } from '../components/Calendar/Calendar';

const profileHref = authsProfileHref(authsFrontBase);

export function HomePage() {
  const { user, logout } = useSession();

  return (
    <main>
      <h1>Planner</h1>
      <p>Hi {user?.username}!</p>
      <p>
        <a href={profileHref}>Profile</a>
      </p>
      <Button type="button" label="Sign out" onClick={() => void logout()} />
      <Calendar />
    </main>
  );
}
