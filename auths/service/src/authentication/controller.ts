import { Router } from 'express';

import { UsernameTakenError, isUsernameAvailable, signUp } from './service';
import { formatZodError, signUpBody, username } from './validation';

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
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
