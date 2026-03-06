import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import pool from './db';

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
