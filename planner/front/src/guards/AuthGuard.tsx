import { type ReactNode, useEffect } from 'react';

import { useSessionStatus } from '../auth/session';
import { authsLoginHref } from '../config/urls';

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.assign(authsLoginHref());
    }
  }, [status]);

  if (status !== 'authenticated') {
    return null;
  }

  return children;
}
