import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { mode } = env;

  return {
    mode,
    build: {
      outDir: '.vite/build',
      lib: {
        entry: 'src/main/index.ts',
        fileName: () => 'main.cjs',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: [
          'electron',
          'path',
          'fs',
          'http',
          'child_process',
          'os',
          'util',
          'stream',
          'buffer',
          'events'
        ],
      },
    },
    resolve: {
      alias: {
        '@main': '/src/main',
        '@shared': '/src/shared',
      },
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  } as UserConfig;
});
