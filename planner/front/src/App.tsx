import { Navigate, Route, Routes } from 'react-router-dom';

import { ThemeToggle } from '@common/components/ThemeToggle';

import { AuthGuard } from './guards/AuthGuard';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route
          path="/"
          element={
            <AuthGuard>
              <HomePage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
