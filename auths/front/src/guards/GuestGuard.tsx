import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { isAuthenticated } from '../auth/session';

export function GuestGuard({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
