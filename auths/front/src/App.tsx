import { Route, Routes } from 'react-router-dom';

import { ThemeToggle } from '@common/components/ThemeToggle';

import styles from './App.module.scss';
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
