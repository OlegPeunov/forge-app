import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import { authRouter } from './auth';
import { coachRouter } from './coach';
import { sessionsRouter } from './sessions';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use(coachRouter);
app.use(sessionsRouter);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Forge API listening on http://localhost:${port}`);
});
