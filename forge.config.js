import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config = {
   packagerConfig: {
      asar: true,
      executableName: 'ginger-media-handler',
      extraResource: ['./docs'],
   },
   rebuildConfig: {},
   makers: [
      new MakerSquirrel({}),
      new MakerZIP({}, ['darwin']),
      new MakerDeb({}),
   ],
   plugins: [
      new VitePlugin({
         build: [
            {
               entry: 'src/main/index.ts',
               config: 'vite.main.config.ts',
               target: 'main',
            },
            {
               entry: 'src/preload/index.ts',
               config: 'vite.preload.config.ts',
               target: 'preload',
            },
         ],
         renderer: [
            {
               name: 'main_window',
               config: 'vite.renderer.config.ts',
            },
         ],
      }),
   ],
};

export default config;
