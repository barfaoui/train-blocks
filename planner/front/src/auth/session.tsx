import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { MeUser, UpdateAvatarBody } from '@common/auth-types';

import { logout as apiLogout, updateAvatar as apiUpdateAvatar, getMe } from './auths-service';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type SessionValue = {
  status: SessionStatus;
  user: MeUser | null;
  logout: () => Promise<void>;
  updateAvatar: (avatar: UpdateAvatarBody) => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<MeUser | null>(null);

  const applyUser = useCallback((me: MeUser) => {
    setUser(me);
    setStatus('authenticated');
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((me) => {
        if (!cancelled) {
          applyUser(me);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearUser();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyUser, clearUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearUser();
    }
  }, [clearUser]);

  const updateAvatar = useCallback(
    async (avatar: UpdateAvatarBody) => {
      applyUser(await apiUpdateAvatar(avatar));
    },
    [applyUser],
  );

  const value = useMemo(
    () => ({ status, user, logout, updateAvatar }),
    [status, user, logout, updateAvatar],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

export function useSessionStatus(): SessionStatus {
  return useSession().status;
}
