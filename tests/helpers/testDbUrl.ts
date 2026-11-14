import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Never fall back to DATABASE_URL: tests truncate tables.
export const testDbUrl =
  process.env.TEST_DATABASE_URL ?? 'postgresql://ecommerce:ecommerce@localhost:5434/ecommerce_test';
