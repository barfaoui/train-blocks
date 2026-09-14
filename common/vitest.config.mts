import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    env: {
      JWT_SECRET: 'test-jwt-secret-for-vitest',
    },
  },
});
