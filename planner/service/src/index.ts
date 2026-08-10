import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = Number(process.env.PLANNER_PORT);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'planner' });
});

app.listen(PORT, () => {
  console.log(`Planner service running on http://localhost:${PORT}`);
});
