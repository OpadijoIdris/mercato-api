import { PrismaPg } from '@prisma/adapter-pg';
import config from '../config/env.js';
import { PrismaClient } from './generated/client.js';

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// Single shared client (and connection pool) for the whole process.
// `password` is omitted from every user query unless a query opts back in with
// `omit: { password: false }`, so a hash can never leak through a response by accident.
const prisma = new PrismaClient({
  adapter,
  omit: { user: { password: true } },
});

export default prisma;
