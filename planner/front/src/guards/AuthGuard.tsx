import { type ReactNode, useEffect } from 'react';

import { isAuthenticated } from '../auth/session';
import { authsLoginHref } from '../config/urls';

export function AuthGuard({ children }: { children: ReactNode }) {
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (authenticated) {
      return;
    }

    // localStorage is per origin, so a token set on :3002 is invisible on :3004.
    // Until same-origin deploy or cookies, planner keeps sending guests to auths
    // login unless accessToken is set on :3004.
    window.location.assign(authsLoginHref());
  }, [authenticated]);

  if (!authenticated) {
    return null;
  }

  return children;
}
