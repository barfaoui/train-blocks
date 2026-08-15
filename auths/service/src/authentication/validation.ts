import { ZodError, z } from 'zod';

import type { FieldError } from '../data/types/authentication';

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

export function formatZodError(error: ZodError): { error: string; details: FieldError[] } {
  return {
    error: 'Invalid request',
    details: error.issues.map((issue) => ({
      path: issue.path.length === 0 ? 'username' : issue.path.join('.'),
      message: issue.message,
    })),
  };
}
