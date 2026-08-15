import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from './guards/AuthGuard';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
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
  );
}
