import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { mode } = env;
  
  return {
    root: process.cwd(),
    mode,
    build: {
      outDir: '.vite/build',
      rollupOptions: {
        external: ['electron'],
        input: 'src/preload/index.ts',
        output: {
          format: 'cjs',
          inlineDynamicImports: true,
          entryFileNames: 'preload.js',
        },
      },
    },
    resolve: {
      alias: {
        '@preload': '/src/preload',
        '@shared': '/src/shared',
      },
    },
  } as UserConfig;
});
