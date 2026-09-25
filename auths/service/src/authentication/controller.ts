import { type Response, Router } from 'express';

import type { MeUser, PreferenceCategoryId } from '@common/auth-types';
import { requireAuth } from '@common/utils/auth-middleware.util';
import { clearAuthCookie, setAuthCookie } from '@common/utils/cookie.util';

import { changePassword, requestPasswordReset, resetPassword } from './password-service';
import {
  deleteAccount,
  getMe,
  isUsernameAvailable,
  removeEmail,
  resendVerificationEmail,
  setEmail,
  signIn,
  signUp,
  updateAvatar,
  updateDisplayName,
  updatePreferences,
  verifyEmail,
} from './service';
import {
  changePasswordBody,
  forgotPasswordBody,
  formatZodError,
  preferenceCategoryBodies,
  resetPasswordBody,
  setEmailBody,
  signInBody,
  signUpRequest,
  updateAvatarBody,
  updateDisplayNameBody,
  username,
  verifyEmailBody,
} from './validation';
import type { AuthenticatedRequest } from '../data/types/authentication';
import {
  EmailAlreadyVerifiedError,
  EmailDeliveryError,
  EmailNotSetError,
  IncorrectPasswordError,
  InvalidCredentialsError,
  InvalidPreferencesError,
  InvalidResetTokenError,
  InvalidVerificationTokenError,
  UnauthorizedError,
  UnknownUsernameError,
  UsernameTakenError,
  VerificationCooldownError,
} from '../data/types/errors';

export const authenticationRouter = Router();

// These errors carry messages meant to be shown to the user as is.
function userFacingErrorStatus(error: unknown): number | undefined {
  if (error instanceof InvalidVerificationTokenError) return 400;
  if (error instanceof InvalidResetTokenError) return 400;
  if (error instanceof EmailNotSetError || error instanceof EmailAlreadyVerifiedError) return 409;
  if (error instanceof VerificationCooldownError) return 429;
  if (error instanceof EmailDeliveryError) return 502;
  return undefined;
}

function respondWithError(res: Response, error: unknown) {
  if (error instanceof InvalidPreferencesError) {
    res.status(400).json({ error: 'Invalid request', details: error.details });
    return;
  }
  // Field-level, so the form can show them next to the right input.
  if (error instanceof IncorrectPasswordError) {
    res.status(400).json({
      error: 'Invalid request',
      details: [{ path: 'currentPassword', message: error.message }],
    });
    return;
  }
  if (error instanceof UnknownUsernameError) {
    res.status(404).json({
      error: error.message,
      details: [{ path: 'username', message: error.message }],
    });
    return;
  }
  if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const status = userFacingErrorStatus(error);
  if (status) {
    if (error instanceof EmailDeliveryError) {
      console.error(error.reason);
    }
    res.status(status).json({ error: (error as Error).message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}

async function respondWithProfile(res: Response, update: () => Promise<MeUser>) {
  try {
    res.status(200).json(await update());
  } catch (error) {
    respondWithError(res, error);
  }
}

authenticationRouter.get('/usernames/:username/availability', async (req, res) => {
  const parsed = username.safeParse(req.params.username);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error, 'username'));
    return;
  }

  try {
    const available = await isUsernameAvailable(parsed.data);
    res.status(200).json({ available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authenticationRouter.post('/sign-up', async (req, res) => {
  const parsed = signUpRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    const result = await signUp(parsed.data.username, parsed.data.password, {
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
    });
    setAuthCookie(res, result.token);
    res.status(201).json({ user: result.user });
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authenticationRouter.get('/me', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;

  try {
    const me = await getMe(user.id);
    res.status(200).json(me);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authenticationRouter.delete('/me', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;

  try {
    await deleteAccount(user.id);
    clearAuthCookie(res);
    res.status(204).end();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authenticationRouter.patch('/me/avatar', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const parsed = updateAvatarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  await respondWithProfile(res, () => updateAvatar(user.id, parsed.data));
});

authenticationRouter.patch('/me/display-name', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const parsed = updateDisplayNameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  await respondWithProfile(res, () => updateDisplayName(user.id, parsed.data.displayName));
});

authenticationRouter.patch('/me/preferences/:category', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const category = req.params.category as PreferenceCategoryId;
  const schema = Object.prototype.hasOwnProperty.call(preferenceCategoryBodies, category)
    ? preferenceCategoryBodies[category]
    : undefined;
  if (!schema) {
    res.status(404).json({ error: 'Unknown preference category' });
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  await respondWithProfile(res, () => updatePreferences(user.id, parsed.data));
});

authenticationRouter.put('/me/email', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const parsed = setEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  await respondWithProfile(res, () => setEmail(user.id, parsed.data.email));
});

authenticationRouter.delete('/me/email', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;

  await respondWithProfile(res, () => removeEmail(user.id));
});

authenticationRouter.post('/me/email/verification', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;

  try {
    await resendVerificationEmail(user.id);
    res.status(204).end();
  } catch (error) {
    respondWithError(res, error);
  }
});

// Public: see `verifyEmail`.
authenticationRouter.post('/email/verify', async (req, res) => {
  const parsed = verifyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    await verifyEmail(parsed.data.token);
    res.status(204).end();
  } catch (error) {
    respondWithError(res, error);
  }
});

// Also hands this device a new session: the change signs out every existing one.
authenticationRouter.post('/me/password', requireAuth, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const parsed = changePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    const result = await changePassword(
      user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    setAuthCookie(res, result.token);
    res.status(204).end();
  } catch (error) {
    respondWithError(res, error);
  }
});

authenticationRouter.post('/password/forgot', async (req, res) => {
  const parsed = forgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    res.status(200).json(await requestPasswordReset(parsed.data.username));
  } catch (error) {
    respondWithError(res, error);
  }
});

// Public, like /email/verify. Every session is signed out afterwards, this browser's too.
authenticationRouter.post('/password/reset', async (req, res) => {
  const parsed = resetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    clearAuthCookie(res);
    res.status(204).end();
  } catch (error) {
    respondWithError(res, error);
  }
});

authenticationRouter.post('/sign-in', async (req, res) => {
  const parsed = signInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    const result = await signIn(parsed.data.username, parsed.data.password);
    setAuthCookie(res, result.token);
    res.status(200).json({ user: result.user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authenticationRouter.post('/sign-out', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});
