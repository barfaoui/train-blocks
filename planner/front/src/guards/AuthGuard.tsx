import { type ReactNode, useEffect } from 'react';

import { authsLoginHref } from '@common/app-urls';

import { useSessionStatus } from '../auth/session';
import { authsFrontBase, sameOrigin } from '../auth/url-bases';

const loginHref = authsLoginHref(authsFrontBase);

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
