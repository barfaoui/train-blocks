import { type ZodError } from 'zod';

import type { FieldError } from '../data/types/authentication';

export {
  changePasswordBody,
  forgotPasswordBody,
  password,
  preferenceCategoryBodies,
  resetPasswordBody,
  setEmailBody,
  signInBody,
  signUpBody,
  signUpRequest,
  updateAvatarBody,
  updateDisplayNameBody,
  username,
  verifyEmailBody,
} from '@common/auth-validation';

// `rootPath` labels issues about the whole value, like a missing body or an unknown key.
export function formatZodError(
  error: ZodError,
  rootPath = 'body',
): { error: string; details: FieldError[] } {
  return {
    error: 'Invalid request',
    details: error.issues.map((issue) => ({
      path: issue.path.length === 0 ? rootPath : issue.path.join('.'),
      message: issue.message,
    })),
  };
}
