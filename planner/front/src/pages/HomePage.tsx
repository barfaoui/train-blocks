import { useState } from 'react';

import { authsProfileHref } from '@common/app-urls';
import { Button } from '@common/components/Button';

import styles from './HomePage.module.scss';
import { useSession } from '../auth/session';
import { authsFrontBase } from '../auth/url-bases';
import { Calendar } from '../components/Calendar/Calendar';
import { CreateEventModal } from '../events/CreateEventModal';

const profileHref = authsProfileHref(authsFrontBase);

export function HomePage() {
  const { logout } = useSession();
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Planner</h1>
        <nav className={styles.headerActions}>
          <a className={styles.profileLink} href={profileHref}>
            Profile
          </a>
          <Button type="button" label="Sign out" small onClick={() => void logout()} />
        </nav>
      </header>
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
