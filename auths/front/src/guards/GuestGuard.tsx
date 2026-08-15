import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useSessionStatus } from '../auth/session';

export function GuestGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
}
