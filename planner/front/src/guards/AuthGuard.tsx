import { type ReactNode, useEffect } from 'react';

import { authsLoginHref } from '@common/app-urls';

import { useSessionStatus } from '../auth/session';

const loginHref = authsLoginHref(import.meta.env.VITE_SAME_ORIGIN === 'true');

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.assign(loginHref);
    }
  }, [status]);

  if (status !== 'authenticated') {
    return null;
  }

  return children;
}
