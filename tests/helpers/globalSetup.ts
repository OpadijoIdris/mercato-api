import { execSync } from 'node:child_process';
import { testDbUrl } from './testDbUrl.js';

// Bring the test database schema up to date once before any test file runs.
export default function setup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });
}
