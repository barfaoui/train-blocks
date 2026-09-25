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

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super('This verification link is invalid or has expired');
    this.name = 'InvalidVerificationTokenError';
  }
}

export class EmailNotSetError extends Error {
  constructor() {
    super('Add an email address first');
    this.name = 'EmailNotSetError';
  }
}

export class EmailAlreadyVerifiedError extends Error {
  constructor() {
    super('This email address is already verified');
    this.name = 'EmailAlreadyVerifiedError';
  }
}

export class VerificationCooldownError extends Error {
  constructor() {
    super('Please wait a minute before requesting another email');
    this.name = 'VerificationCooldownError';
  }
}

export class EmailDeliveryError extends Error {
  constructor(readonly reason?: unknown) {
    super("We couldn't send the email, please try again");
    this.name = 'EmailDeliveryError';
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Your current password is incorrect');
    this.name = 'IncorrectPasswordError';
  }
}

export class UnknownUsernameError extends Error {
  constructor() {
    super("We couldn't find an account with this username");
    this.name = 'UnknownUsernameError';
  }
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super('This password reset link is invalid or has expired');
    this.name = 'InvalidResetTokenError';
  }
}
