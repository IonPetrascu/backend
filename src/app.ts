import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db';
import notesRouter from './routes/notes';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

const PgSession = connectPgSimple(session);

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://94.176.182.194'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(express.json());

app.use(session({
  store: new PgSession({
    pool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/v1/auth',  authRouter);
app.use('/api/v1/notes', notesRouter);

app.use(errorHandler);

export default app;
