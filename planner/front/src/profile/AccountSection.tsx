import { useState } from 'react';

import { type MeUser } from '@common/auth-types';
import { Button } from '@common/components/Button';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './AccountSection.module.scss';
import { ResetPasswordModal } from './ResetPasswordModal';
import { SectionCard } from './SectionCard';

export type AccountSectionProps = {
  user: MeUser;
};

export function AccountSection({ user }: AccountSectionProps) {
  const [resettingPassword, setResettingPassword] = useState(false);

  return (
    <SectionCard title="Account" description="How you sign in and get your account back.">
      <dl className={styles.list}>
        <div className={styles.row}>
          <TypographySmall as="dt" className={styles.term}>
            Username
          </TypographySmall>
          <TypographyMedium as="dd" className={styles.value}>
            {user.username}
          </TypographyMedium>
        </div>

        <div className={styles.row}>
          <TypographySmall as="dt" className={styles.term}>
            Email
          </TypographySmall>
          {user.email ? (
            <TypographyMedium as="dd" className={styles.value}>
              {user.email}
              <TypographySmall
                className={[styles.badge, user.emailVerifiedAt ? styles['-verified'] : undefined]
                  .filter(Boolean)
                  .join(' ')}
              >
                {user.emailVerifiedAt ? 'Verified' : 'Not verified'}
              </TypographySmall>
            </TypographyMedium>
          ) : (
            <dd className={styles.callout}>
              <TypographySmall as="p" className={styles.calloutText}>
                Add and verify an email address so you never lose access to your account: it lets
                you reset your password if you forget it.
              </TypographySmall>
              <Button
                type="button"
                style="small"
                label="Add an email address"
                onClick={() => {
                  // TODO: start the email linking and verification flow.
                }}
              />
            </dd>
          )}
        </div>

        <div className={styles.row}>
          <TypographySmall as="dt" className={styles.term}>
            Password
          </TypographySmall>
          <dd className={styles.inline}>
            <TypographyMedium className={styles.value}>••••••••••</TypographyMedium>
            <Button
              type="button"
              style="small"
              outlined
              label="Reset password"
              onClick={() => setResettingPassword(true)}
            />
          </dd>
        </div>
      </dl>
      {resettingPassword ? (
        <ResetPasswordModal onClose={() => setResettingPassword(false)} />
      ) : null}
    </SectionCard>
  );
}
