import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getErrorMessage } from '@common/utils/error-message.util';

import { ErrorBoundary } from './ErrorBoundary';
import { Toast, type ToastVariant } from './Toast';

export type ErrorReporterValue = {
  reportError: (error: unknown) => void;
  showToast: (message: string, variant?: ToastVariant) => void;
};

type ToastState = {
  message: string;
  variant: ToastVariant;
  key: number;
};

const ErrorReporterContext = createContext<ErrorReporterValue | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    setToast((current) => ({ message, variant, key: (current?.key ?? 0) + 1 }));
  }, []);

  const reportError = useCallback(
    (error: unknown) => {
      try {
        console.error(error);
        showToast(getErrorMessage(error), 'error');
      } catch {
        // The reporter itself must never throw, or it could re-trigger window.onerror.
      }
    },
    [showToast],
  );

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError(event.error ?? event.message);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [reportError]);

  const value = useMemo(() => ({ reportError, showToast }), [reportError, showToast]);

  return (
    <ErrorReporterContext.Provider value={value}>
      <ErrorBoundary onError={reportError}>{children}</ErrorBoundary>
      {toast ? (
        <Toast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
    </ErrorReporterContext.Provider>
  );
}

export function useErrorReporter(): ErrorReporterValue {
  const context = useContext(ErrorReporterContext);
  if (!context) {
    throw new Error('useErrorReporter must be used within ErrorProvider');
  }
  return context;
}
