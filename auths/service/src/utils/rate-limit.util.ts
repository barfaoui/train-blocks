import { rateLimit } from 'express-rate-limit';

const TOO_MANY_REQUESTS = { error: 'Too many attempts. Please try again later.' };

// Password and token guessing. Only failures count, so signing in normally never locks anyone out.
export const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: TOO_MANY_REQUESTS,
});

// Account creation and anything that sends an email.
export const sendingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: TOO_MANY_REQUESTS,
});
