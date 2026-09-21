import { type Response, Router } from 'express';

import type { MeUser, PreferenceCategoryId } from '@common/auth-types';
import { requireAuth } from '@common/utils/auth-middleware.util';
import { clearAuthCookie, setAuthCookie } from '@common/utils/cookie.util';

import {
  getMe,
  isUsernameAvailable,
  signIn,
  signUp,
  updateAvatar,
  updateDisplayName,
  updatePreferences,
} from './service';
import {
  formatZodError,
  preferenceCategoryBodies,
  signInBody,
  signUpRequest,
  updateAvatarBody,
  updateDisplayNameBody,
  username,
} from './validation';
import type { AuthenticatedRequest } from '../data/types/authentication';
import {
  InvalidCredentialsError,
  InvalidPreferencesError,
  UnauthorizedError,
  UsernameTakenError,
} from '../data/types/errors';

export const authenticationRouter = Router();

// Sends the refreshed profile after an update, or the matching error.
async function respondWithProfile(res: Response, update: () => Promise<MeUser>) {
  try {
    res.status(200).json(await update());
  } catch (error) {
    if (error instanceof InvalidPreferencesError) {
      res.status(400).json({ error: 'Invalid request', details: error.details });
      return;
    }
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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
