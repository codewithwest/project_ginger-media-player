import { Command } from 'commander';
import { app } from 'electron';
import path from 'path';
import { getServices } from '../utils/services';
import { outputJSON, outputText, outputSuccess } from '../utils/output';

export class LibraryCommands {
   constructor(private program: Command) { }

   register(): void {
      this.program
         .command('library')
         .description('Manage media library')
         .option('-a, --add <path>', 'Add folder to library')
         .option('-s, --scan', 'Scan library for media files')
         .option('-l, --list', 'List all tracks in library')
         .option('-j, --json', 'Output in JSON format')
         .action(async (options) => {
            const { libraryService } = await getServices();

            if (options.add) {
               const folderPath = path.resolve(options.add);
               await libraryService.addFolder(folderPath);

               if (options.json) {
                  outputJSON({ status: 'added', folder: folderPath });
               } else {
                  outputSuccess(`Added folder: ${folderPath}`);
               }
            }

            if (options.scan) {
               if (!options.json) {
                  outputText('🔍 Scanning library...');
               }

               const tracks = await libraryService.scan();

               if (options.json) {
                  outputJSON({ status: 'scanned', count: tracks.length });
               } else {
                  outputSuccess(`Found ${tracks.length} tracks`);
               }
            }

            if (options.list) {
               const tracks = libraryService.getTracks();

               if (options.json) {
                  outputJSON({ tracks });
               } else {
                  outputText(`📚 Library (${tracks.length} tracks):`);
                  tracks.forEach((track, i) => {
                     outputText(`   ${i + 1}. ${track.title || track.path}`);
                     if (track.artist) {
                        outputText(`      Artist: ${track.artist}`);
                     }
                  });
               }
            }

            app.quit();
         });
   }
}
