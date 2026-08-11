import cors from 'cors';
import dotenv from 'dotenv';
import { environment } from 'common';
import express from 'express';

dotenv.config();
const app = express();
const PORT = environment.ports.auths;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auths' });
});

app.listen(PORT, () => {
  console.log(`Auths service running on http://localhost:${PORT}`);
});
