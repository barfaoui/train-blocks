import type { AuthUser } from '@common/auth-types';

export type { AuthUser, FieldError, MeUser, SignInBody, SignUpBody } from '@common/auth-types';

export type AuthenticatedRequest = import('express').Request & {
  user: AuthUser;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type UsernameAvailability = {
  available: boolean;
};
