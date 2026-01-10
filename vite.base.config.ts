import type { AddressInfo } from 'net';
import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import type { InputOption } from 'rollup';
import path from 'path';

export const external = ['electron'];

export function getBuildConfig(env: ConfigEnv<'build'>, config?: UserConfig): UserConfig {
  const { root, mode, command } = env;

  return {
    root,
    mode,
    build: {
      ...config?.build,
      outDir: '.vite/build',
    },
    ...config,
  };
}

export function getBuildDefine(env: ConfigEnv<'build'>) {
  const { command, forgeConfig } = env;
  const names = forgeConfig.renderer.filter(({ name }) => name != null).map(({ name }) => name);
  return {
    'MAIN_WINDOW_VITE_DEV_SERVER_URL': command === 'serve' ? JSON.stringify(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) : undefined,
    'MAIN_WINDOW_VITE_NAME': names.length > 0 ? JSON.stringify(names[0]) : undefined,
  };
}

export function pluginHotRestart(command: 'reload' | 'restart'): Plugin {
  return {
    name: 'plugin-hot-restart',
    closeBundle() {
      if (command === 'reload') {
        // Send reload command to Electron
      } else {
        // Send restart command to Electron
      }
    },
  };
}

export function pluginExposeRenderer(name: string): Plugin {
  return {
    name: 'plugin-expose-renderer',
    configureServer(server) {
      process.viteDevServers ??= {};
      process.viteDevServers[name] = server;
    },
  };
}

declare global {
  var viteDevServers: Record<string, import('vite').ViteDevServer>;
}
