import { Command } from 'commander';
import { app } from 'electron';
import path from 'path';
import { getServices } from '../utils/services';
import { outputJSON, outputText, outputSuccess } from '../utils/output';

export class PlaylistCommands {
   constructor(private program: Command) { }

   register(): void {
      this.program
         .command('playlist')
         .description('Manage playlist')
         .option('-a, --add <file>', 'Add file to playlist')
         .option('-c, --clear', 'Clear playlist')
         .option('-l, --list', 'List playlist')
         .option('-j, --json', 'Output in JSON format')
         .action(async (options) => {
            const { playlistService } = await getServices();

            if (options.add) {
               const filePath = path.resolve(options.add);
               const playlist = playlistService.load();

               playlist.push({
                  id: Date.now().toString(),
                  type: 'local',
                  path: filePath,
                  title: path.basename(filePath)
               });

               playlistService.save(playlist);

               if (options.json) {
                  outputJSON({ status: 'added', file: filePath, count: playlist.length });
               } else {
                  outputSuccess(`Added to playlist: ${path.basename(filePath)}`);
                  outputText(`   Total tracks: ${playlist.length}`);
               }
            }

            if (options.clear) {
               playlistService.save([]);

               if (options.json) {
                  outputJSON({ status: 'cleared' });
               } else {
                  outputSuccess('Playlist cleared');
               }
            }

            if (options.list) {
               const playlist = playlistService.load();

               if (options.json) {
                  outputJSON({ playlist });
               } else {
                  outputText(`🎵 Playlist (${playlist.length} tracks):`);
                  playlist.forEach((item, i) => {
                     outputText(`   ${i + 1}. ${item.title || path.basename(item.path)}`);
                  });
               }
            }

            app.quit();
         });
   }
}
