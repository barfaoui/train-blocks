import { Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@common/components/NotFoundPage';

import { AuthGuard } from './guards/AuthGuard';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<NotFoundPage homeHref="/" />} />
      </Routes>
    </>
  );
}
