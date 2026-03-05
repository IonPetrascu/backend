import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// Prisma 7 использует "драйвер-адаптер" вместо прямого строкового подключения.
// Pool — это пул соединений с PostgreSQL из библиотеки 'pg' (нативный драйвер).
// Пул переиспользует соединения вместо создания нового при каждом запросе.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// PrismaPg — адаптер, который соединяет Prisma с нативным pg-драйвером.
// Prisma 7 требует передавать адаптер явно при создании клиента.
const adapter = new PrismaPg(pool);

// Создаём единственный экземпляр Prisma Client с адаптером.
const prisma = new PrismaClient({ adapter });

export default prisma;
