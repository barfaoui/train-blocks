import type { AuthUser } from '@common/auth-types';

export type {
  AuthenticatedRequest,
  AuthUser,
  FieldError,
  MeUser,
  SignInBody,
  SignUpBody,
} from '@common/auth-types';

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type UsernameAvailability = {
  available: boolean;
};
