import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AuthUser, MeUser } from '@common/auth-types';

import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resetPassword as apiResetPassword,
  getMe,
} from './auths-service';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type SessionValue = {
  status: SessionStatus;
  user: MeUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Resetting signs out every session, this browser's included.
  resetPassword: (token: string, password: string) => Promise<void>;
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

  const establishSession = useCallback(
    async (authenticate: () => Promise<{ user: AuthUser }>) => {
      const { user } = await authenticate();
      try {
        applyUser(await getMe());
      } catch {
        applyUser({
          ...user,
          email: null,
          emailVerifiedAt: null,
          displayName: null,
          avatarIcon: null,
          avatarColor: null,
          createdAt: '',
          preferences: null,
        });
      }
    },
    [applyUser],
  );

  const login = useCallback(
    (username: string, password: string) => establishSession(() => apiLogin(username, password)),
    [establishSession],
  );

  const register = useCallback(
    (username: string, password: string) => establishSession(() => apiRegister(username, password)),
    [establishSession],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearUser();
    }
  }, [clearUser]);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await apiResetPassword(token, password);
      clearUser();
    },
    [clearUser],
  );

  const value = useMemo(
    () => ({ status, user, login, register, logout, resetPassword }),
    [status, user, login, register, logout, resetPassword],
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
