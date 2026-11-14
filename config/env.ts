import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== '' ? n : fallback;
};

const required = (key: string, value: string | undefined): string => {
  if (process.env.NODE_ENV === 'test') return value ?? `test-${key}`;
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 3000),
  databaseUrl: required('DATABASE_URL', process.env.DATABASE_URL),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
};

export default config;
