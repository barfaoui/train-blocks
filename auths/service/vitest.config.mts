import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  root: dir,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../front/src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://app:app@localhost:5432/training_planning',
      JWT_SECRET: 'test-jwt-secret-for-vitest',
    },
  },
  resolve: {
    alias: {
      '@common': path.join(repoRoot, 'common'),
    },
  },
});
