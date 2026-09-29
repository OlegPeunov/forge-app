import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Forge API listening on http://localhost:${port}`);
});
