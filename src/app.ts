import express from 'express';
import cors from 'cors';
import notesRouter from './routes/notes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// cors() добавляет в каждый ответ заголовок:
// Access-Control-Allow-Origin: http://localhost:5173
// Браузер видит этот заголовок и разрешает фронту читать ответ.
app.use(cors({
  // origin: '*' — разрешить запросы от ЛЮБОГО сайта.
  // Удобно для разработки, но опасно в продакшне —
  // любой сайт в интернете сможет делать запросы к твоему API.
  //
  // origin: 'http://localhost:5173' — разрешить только конкретный адрес.
  // В продакшне здесь будет твой реальный домен: 'https://myapp.com'
  origin: 'http://localhost:5173',

  // Какие HTTP методы разрешены с фронта
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  // Разрешаем заголовок Content-Type — он нужен для отправки JSON
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.use('/api/v1/notes', notesRouter);

// errorHandler всегда последним
app.use(errorHandler);

export default app;
