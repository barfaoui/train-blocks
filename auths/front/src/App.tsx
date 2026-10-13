import { Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@common/components/NotFoundPage';
import { ThemeToggle } from '@common/components/ThemeToggle';

import styles from './App.module.scss';
import { plannerHomeHref } from './auth/url-bases';
import { GuestGuard } from './guards/GuestGuard';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export function App() {
  return (
    <>
      <div className={styles.floatingThemeToggle}>
        <ThemeToggle />
      </div>
      <Routes>
        <Route
          path="/forgot-password"
          element={
            <GuestGuard>
              <ForgotPasswordPage />
            </GuestGuard>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route path="*" element={<NotFoundPage homeHref={plannerHomeHref} />} />
      </Routes>
    </>
  );
}
