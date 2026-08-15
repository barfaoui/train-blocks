import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useSessionStatus } from '../auth/session';

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
