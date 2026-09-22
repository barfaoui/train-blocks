export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function getErrorMessage(value: unknown): string {
  try {
    if (value instanceof Error && value.message) {
      return value.message;
    }

    if (typeof value === 'string' && value) {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'message' in value &&
      typeof (value as { message: unknown }).message === 'string' &&
      (value as { message: string }).message
    ) {
      return (value as { message: string }).message;
    }

    return DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
}
