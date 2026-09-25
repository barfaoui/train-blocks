import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { localhostOrigin } from '@common/app-urls';
import { environment } from '@common/environment';

import { authenticationRouter } from './authentication/controller';

dotenv.config();
const app = express();
// Behind one reverse proxy (Caddy) in production: take the client IP from X-Forwarded-For.
app.set('trust proxy', 1);
const PORT = environment.ports['auths-service'];

app.use(
  cors({
    origin: corsOrigins(),
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auths' });
});

app.use('/api/auth', authenticationRouter);

app.listen(PORT, () => {
  console.log(`Auths service running on http://localhost:${PORT}`);
});

function corsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGINS;
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [localhostOrigin('auths-front'), localhostOrigin('planner-front')];
}
