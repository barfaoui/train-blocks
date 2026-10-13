import './zod-config';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AUTHS_FRONT_PATH } from '@common/app-urls';
import { ErrorProvider } from '@common/components/ErrorProvider';
import { ThemeProvider } from '@common/styles/ThemeProvider';

import { App } from './App';
import { SessionProvider } from './auth/session';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorProvider>
      <ThemeProvider>
        <BrowserRouter basename={AUTHS_FRONT_PATH}>
          <SessionProvider>
            <App />
          </SessionProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorProvider>
  </StrictMode>,
);
