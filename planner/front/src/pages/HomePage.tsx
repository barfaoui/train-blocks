import { useState } from 'react';

import { authsProfileHref } from '@common/app-urls';
import { Button } from '@common/components/Button';

import { useSession } from '../auth/session';
import { authsFrontBase } from '../auth/url-bases';
import { Calendar } from '../components/Calendar/Calendar';
import { CreateEventModal } from '../events/CreateEventModal';

const profileHref = authsProfileHref(authsFrontBase);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HomePage() {
  const { user, logout } = useSession();
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <main>
      <h1>Planner</h1>
      <p>Hi {user?.username}!</p>
      <p>
        <a href={profileHref}>Profile</a>
      </p>
      <Button type="button" label="Sign out" onClick={() => void logout()} />
      <Button type="button" label="✚ Create event" onClick={() => setCreateDate(today())} />
      <Calendar onCreateRequested={setCreateDate} reloadKey={reloadKey} />
      {createDate ? (
        <CreateEventModal
          initialDate={createDate}
          onClose={() => setCreateDate(null)}
          onCreated={() => {
            setCreateDate(null);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
    </main>
  );
}
