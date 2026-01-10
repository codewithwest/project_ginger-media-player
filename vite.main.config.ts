import type { ConfigEnv, UserConfig } from 'vite';
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
        fileName: () => 'main.js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: [
          'electron',
          'electron-squirrel-startup',
          'express',
          'fluent-ffmpeg',
          'ffmpeg-static',
          'ffprobe-static',
          'get-port',
          'cors',
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
