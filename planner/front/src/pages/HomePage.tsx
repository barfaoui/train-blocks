import { useState } from 'react';

import { authsProfileHref } from '@common/app-urls';
import { ThemeToggle } from '@common/components/ThemeToggle';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './HomePage.module.scss';
import watermelonLogo from '../../assets/watermelon.svg';
import { useSession } from '../auth/session';
import { authsFrontBase } from '../auth/url-bases';
import { Calendar } from '../components/Calendar/Calendar';
import { CreateEventModal } from '../events/CreateEventModal';

const profileHref = authsProfileHref(authsFrontBase);

export type CreateRequest = {
  date: string;
  time?: string;
};

export function HomePage() {
  const { user, logout } = useSession();
  const [createRequest, setCreateRequest] = useState<CreateRequest | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={watermelonLogo} alt="" className={styles.logoMark} />
          <div className={styles.brandText}>
            <TypographyMedium as="p" className={styles.greeting}>
              Hello, {user?.username}
            </TypographyMedium>
          </div>
        </div>
        <nav className={styles.headerActions}>
          <TypographySmall
            as="button"
            type="button"
            className={styles.signOutButton}
            onClick={() => void logout()}
          >
            Sign out
          </TypographySmall>
          <TypographySmall
            as="a"
            variant="bold"
            href={profileHref}
            className={styles.profileButton}
          >
            Profile
          </TypographySmall>
          <ThemeToggle />
        </nav>
      </header>
      <Calendar
        onCreateRequested={(date, time) => setCreateRequest({ date, time })}
        reloadKey={reloadKey}
      />
      {createRequest ? (
        <CreateEventModal
          initialDate={createRequest.date}
          initialTime={createRequest.time}
          onClose={() => setCreateRequest(null)}
          onCreated={() => {
            setCreateRequest(null);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
    </main>
  );
}
