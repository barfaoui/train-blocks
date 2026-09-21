import { Route, Routes } from 'react-router-dom';

import { ThemeToggle } from '@common/components/ThemeToggle';

import styles from './App.module.scss';
import { GuestGuard } from './guards/GuestGuard';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <>
      <div className={styles.floatingThemeToggle}>
        <ThemeToggle />
      </div>
      <Routes>
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
