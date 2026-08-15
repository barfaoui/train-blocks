import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { environment } from '@common/environment';

import { authenticationRouter } from './authentication/controller';

dotenv.config();
const app = express();
const PORT = environment.ports['auths-service'];

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auths' });
});

app.use('/api/auth', authenticationRouter);

app.listen(PORT, () => {
  console.log(`Auths service running on http://localhost:${PORT}`);
});
