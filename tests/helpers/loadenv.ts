import { testDbUrl } from './testDbUrl.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDbUrl;
