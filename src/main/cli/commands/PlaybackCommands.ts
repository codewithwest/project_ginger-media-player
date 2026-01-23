import { Command } from 'commander';
import { app } from 'electron';
import path from 'path';
import { getServices } from '../utils/services';
import { outputJSON, outputText } from '../utils/output';

export class PlaybackCommands {
   constructor(private program: Command) { }

   register(): void {
      this.registerPlay();
      this.registerPause();
      this.registerStop();
      this.registerNext();
      this.registerPrevious();
      this.registerStatus();
   }

   private registerPlay(): void {
      this.program
         .command('play')
         .description('Play media file or resume playback')
         .argument('[file]', 'Media file path to play')
         .option('-j, --json', 'Output in JSON format')
         .action(async (file, options) => {
            const { playlistService } = await getServices();

            if (file) {
               const playlist = playlistService.load();
               playlist.push({
                  id: Date.now().toString(),
                  type: 'local',
                  path: path.resolve(file),
                  title: path.basename(file)
               });
               playlistService.save(playlist);

               if (options.json) {
                  outputJSON({ status: 'playing', file: path.resolve(file) });
               } else {
                  outputText(`▶️  Playing: ${path.basename(file)}`);
               }
            } else {
               if (options.json) {
                  outputJSON({ status: 'resumed' });
               } else {
                  outputText('▶️  Playback resumed');
               }
            }

            app.quit();
         });
   }

   private registerPause(): void {
      this.program
         .command('pause')
         .description('Pause playback')
         .option('-j, --json', 'Output in JSON format')
         .action((options) => {
            if (options.json) {
               outputJSON({ status: 'paused' });
            } else {
               outputText('⏸️  Playback paused');
            }
            app.quit();
         });
   }

   private registerStop(): void {
      this.program
         .command('stop')
         .description('Stop playback')
         .option('-j, --json', 'Output in JSON format')
         .action((options) => {
            if (options.json) {
               outputJSON({ status: 'stopped' });
            } else {
               outputText('⏹️  Playback stopped');
            }
            app.quit();
         });
   }

   private registerNext(): void {
      this.program
         .command('next')
         .description('Skip to next track')
         .option('-j, --json', 'Output in JSON format')
         .action((options) => {
            if (options.json) {
               outputJSON({ status: 'next' });
            } else {
               outputText('⏭️  Skipped to next track');
            }
            app.quit();
         });
   }

   private registerPrevious(): void {
      this.program
         .command('previous')
         .description('Go to previous track')
         .option('-j, --json', 'Output in JSON format')
         .action((options) => {
            if (options.json) {
               outputJSON({ status: 'previous' });
            } else {
               outputText('⏮️  Went to previous track');
            }
            app.quit();
         });
   }

   private registerStatus(): void {
      this.program
         .command('status')
         .description('Get current playback status')
         .option('-j, --json', 'Output in JSON format')
         .action(async (options) => {
            const { playlistService } = await getServices();
            const playlist = playlistService.load();

            const status = {
               playing: false,
               currentTrack: null,
               position: 0,
               duration: 0,
               playlistLength: playlist.length
            };

            if (options.json) {
               outputJSON(status);
            } else {
               outputText('📊 Playback Status:');
               outputText(`   Status: ${status.playing ? 'Playing' : 'Stopped'}`);
               outputText(`   Playlist: ${status.playlistLength} tracks`);
            }

            app.quit();
         });
   }
}
