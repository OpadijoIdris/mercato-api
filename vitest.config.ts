import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/helpers/loadenv.ts'],
    globalSetup: ['tests/helpers/globalSetup.ts'],
    // Test files share one database, so run them serially (Jest's --runInBand).
    fileParallelism: false,
    testTimeout: 20000,
  },
});
