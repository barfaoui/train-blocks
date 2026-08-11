import cors from 'cors';
import dotenv from 'dotenv';
import { environment } from 'common';
import express from 'express';

dotenv.config();
const app = express();
const PORT = environment.ports.planner;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'planner' });
});

app.listen(PORT, () => {
  console.log(`Planner service running on http://localhost:${PORT}`);
});
