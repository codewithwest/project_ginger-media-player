import { defineConfig } from 'vitest/config'; // eslint-disable-line import/no-unresolved

export default defineConfig({
   test: {
      environment: 'node',
      include: ['tests/**/*.{test,spec}.{ts,tsx}'],
      globals: true,
   },
});
