import type { FieldError } from '@common/auth-types';
import { UserFacingError } from '@common/utils/error-message.util';

export type ErrorBody = {
  error?: string;
  details?: FieldError[];
};

export class AuthApiError extends UserFacingError {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
