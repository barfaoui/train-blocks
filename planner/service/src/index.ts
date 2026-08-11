import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { environment } from '@common/environment';

dotenv.config();
const app = express();
const PORT = environment.ports['planner-service'];

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'planner' });
});

app.listen(PORT, () => {
  console.log(`Planner service running on http://localhost:${PORT}`);
});
