import express from 'express';
import cors from 'cors';
import notesRouter from './routes/notes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://94.176.182.194'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.use('/api/v1/notes', notesRouter);

app.use(errorHandler);

export default app;
