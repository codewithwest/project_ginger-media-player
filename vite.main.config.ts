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
      lib: {
        entry: 'src/main/index.ts',
        fileName: () => 'main.js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['electron', 'electron-squirrel-startup'],
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
