export type FieldError = {
  path: string;
  message: string;
};

export type SignUpBody = {
  username: string;
  password: string;
};

export type SignInBody = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  username: string;
};

export type AuthenticatedRequest = import('express').Request & {
  user: AuthUser;
};

export type MeUser = AuthUser & {
  email: string | null;
  createdAt: string;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type UsernameAvailability = {
  available: boolean;
};
