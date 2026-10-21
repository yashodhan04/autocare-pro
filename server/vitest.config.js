import { defineConfig } from 'vitest/config';

// Integration tests share one MySQL test database, so files must run one at a time.
export default defineConfig({
  test: { environment: 'node', fileParallelism: false, testTimeout: 20000, hookTimeout: 20000, include: ['src/tests/**/*.test.js'], env: { NODE_ENV: 'test' } },
});
