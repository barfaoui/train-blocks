import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  MeUser,
  PreferenceCategoryId,
  UpdateAvatarBody,
  UpdatePreferencesBody,
} from '@common/auth-types';

import {
  deleteAccount as apiDeleteAccount,
  logout as apiLogout,
  removeEmail as apiRemoveEmail,
  setEmail as apiSetEmail,
  updateAvatar as apiUpdateAvatar,
  updateDisplayName as apiUpdateDisplayName,
  updatePreferences as apiUpdatePreferences,
  getMe,
} from './auths-service';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type SessionValue = {
  status: SessionStatus;
  user: MeUser | null;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateAvatar: (avatar: UpdateAvatarBody) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updatePreferences: (
    category: PreferenceCategoryId,
    changes: UpdatePreferencesBody,
  ) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  removeEmail: () => Promise<void>;
  // Re-reads the profile, for changes made outside this tab (like verifying the email).
  reloadUser: () => Promise<void>;
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

  // Unlike logout, a failed request must not clear the local session: the account is
  // still there, and the caller shows the error so the user can try again.
  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    clearUser();
  }, [clearUser]);

  const updateAvatar = useCallback(
    async (avatar: UpdateAvatarBody) => {
      applyUser(await apiUpdateAvatar(avatar));
    },
    [applyUser],
  );

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      applyUser(await apiUpdateDisplayName(displayName));
    },
    [applyUser],
  );

  const updatePreferences = useCallback(
    async (category: PreferenceCategoryId, changes: UpdatePreferencesBody) => {
      applyUser(await apiUpdatePreferences(category, changes));
    },
    [applyUser],
  );

  const reloadUser = useCallback(async () => {
    applyUser(await getMe());
  }, [applyUser]);

  const setEmail = useCallback(
    async (email: string) => {
      try {
        applyUser(await apiSetEmail(email));
      } catch (error) {
        // The address can be saved even when the verification email then fails to send,
        // so pick up whatever the server now has before surfacing the error.
        await reloadUser().catch(() => {});
        throw error;
      }
    },
    [applyUser, reloadUser],
  );

  const removeEmail = useCallback(async () => {
    applyUser(await apiRemoveEmail());
  }, [applyUser]);

  const value = useMemo(
    () => ({
      status,
      user,
      logout,
      deleteAccount,
      updateAvatar,
      updateDisplayName,
      updatePreferences,
      setEmail,
      removeEmail,
      reloadUser,
    }),
    [
      status,
      user,
      logout,
      deleteAccount,
      updateAvatar,
      updateDisplayName,
      updatePreferences,
      setEmail,
      removeEmail,
      reloadUser,
    ],
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
