import { type ZodError, z } from 'zod';

import { signInBody, signUpBody } from '@common/auth-validation';

export { signInBody };

export function confirmPassword(password: string) {
  return z
    .string()
    .min(1, 'Confirm your password')
    .refine((value) => value === password, { message: 'Passwords do not match' });
}

export function signUpForm(values: { password: string }) {
  return signUpBody.extend({
    confirmPassword: confirmPassword(values.password),
  });
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && result[key] === undefined) {
      result[key] = issue.message;
    }
  }

  return result;
}
