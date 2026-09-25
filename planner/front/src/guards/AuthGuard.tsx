import { type ReactNode, useEffect } from 'react';

import { useSessionStatus } from '../auth/session';
import { loginHref, sameOrigin } from '../auth/url-bases';

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const redirect = sameOrigin
      ? `${window.location.pathname}${window.location.search}`
      : window.location.href;
    window.location.assign(`${loginHref}?redirect=${encodeURIComponent(redirect)}`);
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return children;
}
