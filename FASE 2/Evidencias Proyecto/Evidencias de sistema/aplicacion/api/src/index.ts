import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health';

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

export default app;
