import { type ReactNode, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { isAllowedAppRedirect } from '@common/app-urls';

import { useSessionStatus } from '../auth/session';

export function GuestGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const leaveToRedirect =
    status === 'authenticated' && redirect !== null && isAllowedAppRedirect(redirect);

  useEffect(() => {
    if (leaveToRedirect && redirect) {
      window.location.assign(redirect);
    }
  }, [leaveToRedirect, redirect]);

  if (status === 'loading' || leaveToRedirect) {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
