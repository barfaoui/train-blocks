import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { TypographyLarge, TypographyMedium } from '@common/styles/Typography';
import { getErrorMessage } from '@common/utils/error-message.util';

import styles from './VerifyEmailPage.module.scss';
import { verifyEmail } from '../auth/auths-service';
import { useSession } from '../auth/session';

type VerificationState =
  { status: 'verifying' } | { status: 'verified' } | { status: 'failed'; message: string };

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { status: sessionStatus, reloadUser } = useSession();
  // Read once: the token is removed from the address bar right after.
  const [token] = useState(() => searchParams.get('token'));
  const [state, setState] = useState<VerificationState>(
    token
      ? { status: 'verifying' }
      : { status: 'failed', message: 'This verification link is incomplete.' },
  );
  // A token only works once, so StrictMode's second effect run must not send it again.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) {
      return;
    }
    requested.current = true;
    // Keep the token out of the browser history.
    navigate('/verify-email', { replace: true });

    verifyEmail(token)
      .then(() => {
        setState({ status: 'verified' });
        // Signed in here: show the new status on the profile without a reload.
        reloadUser().catch(() => {});
      })
      .catch((error: unknown) => {
        setState({ status: 'failed', message: getErrorMessage(error) });
      });
  }, [token, navigate, reloadUser]);

  const signedIn = sessionStatus === 'authenticated';

  return (
    <main className={styles.page}>
      <div className={styles.card} aria-live="polite">
        {state.status === 'verifying' ? (
          <TypographyLarge as="h1" variant="bold" className={styles.title}>
            Verifying your email address…
          </TypographyLarge>
        ) : null}

        {state.status === 'verified' ? (
          <>
            <TypographyLarge as="h1" variant="bold" className={styles.title}>
              ✅ Email address verified
            </TypographyLarge>
            <TypographyMedium as="p" className={styles.text}>
              Thanks! Your email address is now confirmed. You can turn on email notifications from
              your profile.
            </TypographyMedium>
          </>
        ) : null}

        {state.status === 'failed' ? (
          <>
            <TypographyLarge as="h1" variant="bold" className={styles.title}>
              We couldn't verify your email address
            </TypographyLarge>
            <TypographyMedium as="p" className={styles.text}>
              {state.message} You can ask for a new link from your profile.
            </TypographyMedium>
          </>
        ) : null}

        {state.status === 'verifying' ? null : (
          <Link className={styles.link} to={signedIn ? '/profile' : '/'}>
            {signedIn ? 'Go to your profile' : 'Go to Training Planning'}
          </Link>
        )}
      </div>
    </main>
  );
}
