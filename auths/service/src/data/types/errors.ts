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
