import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { root, mode } = env;
  
  return {
    root,
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
