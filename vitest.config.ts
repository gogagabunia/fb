import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Prevents a stray DB or network call in an imported module from silently
    // hanging the suite.
    testTimeout: 10_000
  }
});
