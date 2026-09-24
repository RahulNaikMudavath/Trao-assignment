import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: [
      { find: /^@shared\/(.*)$/, replacement: path.resolve(__dirname, '../shared/$1') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
    ],
  },
});
