import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import petsRouter from './routes/pets';

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);
app.use(petsRouter);
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', petsRouter);

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

export default app;
