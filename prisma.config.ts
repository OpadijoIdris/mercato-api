import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'database/postgres/schema.prisma',
  migrations: {
    path: 'database/postgres/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
