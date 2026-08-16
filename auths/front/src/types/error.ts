import type { FieldError } from '@common/auth-types';

export type ErrorBody = {
  error?: string;
  details?: FieldError[];
};

export class AuthApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
