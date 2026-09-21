import { Router } from 'express';

import { requireAuth } from '@common/utils/auth-middleware.util';
import { clearAuthCookie, setAuthCookie } from '@common/utils/cookie.util';

import { getMe, isUsernameAvailable, signIn, signUp, updateAvatar } from './service';
import { formatZodError, signInBody, signUpBody, updateAvatarBody, username } from './validation';
import type { AuthenticatedRequest } from '../data/types/authentication';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  UsernameTakenError,
} from '../data/types/errors';

export const authenticationRouter = Router();

authenticationRouter.get('/usernames/:username/availability', async (req, res) => {
  const parsed = username.safeParse(req.params.username);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
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
  const parsed = signUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(formatZodError(parsed.error));
    return;
  }

  try {
    const result = await signUp(parsed.data.username, parsed.data.password);
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

  try {
    const me = await updateAvatar(user.id, parsed.data);
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
