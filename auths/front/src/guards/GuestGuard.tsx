import { type ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { isAllowedAppRedirect } from '@common/app-urls';

import { useSessionStatus } from '../auth/session';
import { plannerHomeHref } from '../auth/url-bases';

export function GuestGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const authenticated = status === 'authenticated';
  const destination =
    redirect !== null && isAllowedAppRedirect(redirect) ? redirect : plannerHomeHref;

  useEffect(() => {
    if (authenticated) {
      window.location.assign(destination);
    }
  }, [authenticated, destination]);

  if (status === 'loading' || authenticated) {
    return null;
  }

  return children;
}
