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

export type MeUser = AuthUser & {
  email: string | null;
  createdAt: string;
};
