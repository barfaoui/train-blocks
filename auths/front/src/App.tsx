import { Route, Routes } from 'react-router-dom';

import { ThemeToggle } from '@common/components/ThemeToggle';

import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        <Route
          path="*"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
      </Routes>
    </>
  );
}
