export class UsernameTakenError extends Error {
  constructor() {
    super('Username already taken');
    this.name = 'UsernameTakenError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class InvalidPreferencesError extends Error {
  constructor(readonly details: { path: string; message: string }[]) {
    super('Invalid preferences');
    this.name = 'InvalidPreferencesError';
  }
}
