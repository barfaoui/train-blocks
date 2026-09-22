export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// Thrown only with a message that's already meant to be read by the user
// (e.g. a backend-provided error string or a validation message). Anything
// else we catch — a plain Error, a TypeError from a bug, a render crash —
// is unpredictable developer-facing text, so getErrorMessage falls back to
// DEFAULT_ERROR_MESSAGE instead of showing it.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

export function getErrorMessage(value: unknown): string {
  try {
    if (value instanceof UserFacingError && value.message) {
      return value.message;
    }

    if (typeof value === 'string' && value) {
      return value;
    }

    return DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
}
