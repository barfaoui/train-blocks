import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { authsMeHref } from '@common/app-urls';

const meHref = authsMeHref(import.meta.env.VITE_SAME_ORIGIN === 'true');

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

const SessionContext = createContext<SessionStatus>('loading');

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch(meHref, { credentials: 'include' })
      .then((response) => {
        if (!cancelled) {
          setStatus(response.ok ? 'authenticated' : 'unauthenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={status}>{children}</SessionContext.Provider>;
}

export function useSessionStatus(): SessionStatus {
  return useContext(SessionContext);
}
