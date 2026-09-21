import { type ZodError } from 'zod';

import type { FieldError } from '../data/types/authentication';

export {
  password,
  preferenceCategoryBodies,
  signInBody,
  signUpBody,
  signUpRequest,
  updateAvatarBody,
  username,
} from '@common/auth-validation';

export function formatZodError(error: ZodError): { error: string; details: FieldError[] } {
  return {
    error: 'Invalid request',
    details: error.issues.map((issue) => ({
      path: issue.path.length === 0 ? 'username' : issue.path.join('.'),
      message: issue.message,
    })),
  };
}
