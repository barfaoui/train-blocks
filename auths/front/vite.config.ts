import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { environment } from '@common/environment';

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, '../..');
const port = environment.ports['auths-front'];

export default defineConfig({
  root,
  cacheDir: path.join(root, 'node_modules/.vite'),
  plugins: [react()],
  resolve: {
    alias: {
      '@common': path.join(repoRoot, 'common'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
  },
  preview: {
    port,
    strictPort: true,
  },
});
