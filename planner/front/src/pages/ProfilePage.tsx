import { Link } from 'react-router-dom';

import { DEFAULT_USER_PREFERENCES } from '@common/auth-types';
import { Avatar } from '@common/components/Avatar';
import { Button } from '@common/components/Button';
import { TypographyLarge, TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './ProfilePage.module.scss';
import { useSession } from '../auth/session';
import { AccountSection } from '../profile/AccountSection';
import { PREFERENCE_CATEGORIES } from '../profile/preference-fields';
import { PreferenceSection } from '../profile/PreferenceSection';
import { SectionCard } from '../profile/SectionCard';

export function ProfilePage() {
  const { user, logout } = useSession();

  if (!user) {
    return null;
  }

  const preferences = user.preferences ?? DEFAULT_USER_PREFERENCES;
  const name = user.displayName ?? user.username;

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <Link className={styles.backLink} to="/">
          <span aria-hidden="true">←</span> Go back to calendar
        </Link>

        <header className={styles.hero}>
          <Avatar
            className={styles.avatar}
            icon={user.avatarIcon}
            color={user.avatarColor}
            name={name}
          />
          <div className={styles.identity}>
            <TypographyLarge as="h1" variant="bold" className={styles.name}>
              {name}
            </TypographyLarge>
            <TypographyMedium as="p" className={styles.handle}>
              @{user.username}
            </TypographyMedium>
            {user.createdAt ? (
              <TypographySmall as="p" className={styles.since}>
                Member since {formatMemberSince(user.createdAt)}
              </TypographySmall>
            ) : null}
          </div>
          <Button
            type="button"
            style="small"
            outlined
            label="Sign out"
            onClick={() => void logout()}
          />
        </header>

        <AccountSection user={user} />

        {PREFERENCE_CATEGORIES.map((category) => (
          <PreferenceSection key={category.id} category={category} preferences={preferences} />
        ))}

        <SectionCard
          danger
          title="Delete account"
          description="Permanently delete your account and everything in it. This can't be undone."
          actions={
            <Button
              type="button"
              style="small"
              variant="dangerous"
              label="Delete account"
              onClick={() => {
                // TODO: confirm and delete the account once the endpoint exists.
              }}
            />
          }
        />
      </div>
    </main>
  );
}

function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}
