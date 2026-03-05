import express from 'express';
import cors from 'cors';
import notesRouter from './routes/notes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.use('/api/v1/notes', notesRouter);

app.use(errorHandler);

export default app;
