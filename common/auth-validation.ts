import { type ZodError, z } from 'zod';

export const username = z
  .string()
  .trim()
  .min(3, 'Username must be 3–32 characters')
  .max(32, 'Username must be 3–32 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
  .transform((value) => value.toLowerCase());

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const signUpBody = z.object({
  username,
  password,
});

export const signInBody = z.object({
  username,
  password: z.string().min(1, 'Password is required'),
});

export function confirmPassword(password: string) {
  return z
    .string()
    .min(1, 'Confirm your password')
    .refine((value) => value === password, { message: 'Passwords do not match' });
}

export function resetPasswordForm(values: { currentPassword: string; newPassword: string }) {
  return z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password.refine((value) => value !== values.currentPassword, {
      message: 'New password must be different from the current one',
    }),
    confirmPassword: confirmPassword(values.newPassword),
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
