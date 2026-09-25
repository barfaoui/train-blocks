import { useState } from 'react';

import { type MeUser } from '@common/auth-types';
import { Button } from '@common/components/Button';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './AccountSection.module.scss';
import { EmailModal } from './EmailModal';
import { RemoveEmailModal } from './RemoveEmailModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { SectionCard } from './SectionCard';
import { resendVerificationEmail } from '../auth/auths-service';

export type AccountSectionProps = {
  user: MeUser;
};

export function AccountSection({ user }: AccountSectionProps) {
  const { reportError, showToast } = useErrorReporter();
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  async function resend() {
    setResending(true);
    try {
      await resendVerificationEmail();
      showToast(`We sent a new verification link to ${user.email}.`, 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setResending(false);
    }
  }

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
            <dd className={styles.emailDetails}>
              <div className={styles.inline}>
                <TypographyMedium className={styles.value}>
                  {user.email}
                  <TypographySmall
                    className={[
                      styles.badge,
                      user.emailVerifiedAt ? styles['-verified'] : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {user.emailVerifiedAt ? 'Verified' : 'Not verified'}
                  </TypographySmall>
                </TypographyMedium>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    style="small"
                    outlined
                    label="Change"
                    onClick={() => setEditingEmail(true)}
                  />
                  <Button
                    type="button"
                    style="small"
                    outlined
                    variant="dangerous"
                    label="Remove"
                    onClick={() => setRemovingEmail(true)}
                  />
                </div>
              </div>
              {user.emailVerifiedAt ? null : (
                <TypographySmall as="p" className={styles.pending}>
                  Open the link we emailed you to verify this address. It expires after 24 hours.{' '}
                  <TypographySmall
                    as="button"
                    type="button"
                    className={styles.textButton}
                    disabled={resending}
                    aria-busy={resending || undefined}
                    onClick={() => void resend()}
                  >
                    {resending ? 'Sending…' : 'Send a new link'}
                  </TypographySmall>
                </TypographySmall>
              )}
            </dd>
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
                onClick={() => setEditingEmail(true)}
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
      {editingEmail ? (
        <EmailModal currentEmail={user.email} onClose={() => setEditingEmail(false)} />
      ) : null}
      {removingEmail && user.email ? (
        <RemoveEmailModal email={user.email} onClose={() => setRemovingEmail(false)} />
      ) : null}
      {resettingPassword ? (
        <ResetPasswordModal onClose={() => setResettingPassword(false)} />
      ) : null}
    </SectionCard>
  );
}
