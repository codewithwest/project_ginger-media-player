import { Command } from 'commander';
import { app } from 'electron';
import path from 'path';
import { getServices } from '../utils/services';
import { outputJSON, outputText, outputProgress, outputSuccess, outputError } from '../utils/output';

export class DownloadCommands {
   constructor(private program: Command) { }

   register(): void {
      this.program
         .command('download')
         .description('Download media from URL')
         .argument('<url>', 'Media URL to download')
         .option('-o, --output <path>', 'Output directory', process.cwd())
         .option('-f, --format <format>', 'Download format (best, audio, video)', 'best')
         .option('-j, --json', 'Output in JSON format')
         .action(async (url, options) => {
            const { downloadService } = await getServices();

            const outputPath = path.join(path.resolve(options.output), 'download.%(ext)s');

            if (options.json) {
               outputJSON({
                  status: 'started',
                  url,
                  output: options.output,
                  format: options.format
               });
            } else {
               outputText(`⬇️  Downloading: ${url}`);
               outputText(`   Format: ${options.format}`);
            }

            try {
               await downloadService.start(
                  `cli-${Date.now()}`,
                  {
                     url,
                     outputPath,
                     format: options.format
                  },
                  (progress) => {
                     if (!options.json && progress.progress) {
                        outputProgress(progress.progress);
                     }
                     if (progress.title && !options.json) {
                        outputText(`\n   Title: ${progress.title}`);
                     }
                  }
               );

               if (options.json) {
                  outputJSON({ status: 'completed', output: options.output });
               } else {
                  outputText('');
                  outputSuccess('Download complete');
               }
            } catch (error: any) {
               if (options.json) {
                  outputJSON({ status: 'failed', error: error.message });
               } else {
                  outputError(`Download failed: ${error.message}`);
               }
               process.exit(1);
            }

            app.quit();
         });
   }
}
