import { Command } from 'commander';
import { app } from 'electron';
import path from 'path';
import { getServices } from '../utils/services';
import { outputJSON, outputText, outputProgress, outputSuccess, outputError } from '../utils/output';

export class ConversionCommands {
   constructor(private program: Command) { }

   register(): void {
      this.program
         .command('convert')
         .description('Convert media file to different format')
         .argument('<input>', 'Input file path')
         .argument('<output>', 'Output file path')
         .option('-f, --format <format>', 'Output format (mp3, aac, wav, flac)', 'mp3')
         .option('-q, --quality <quality>', 'Quality (low, medium, high)', 'high')
         .option('-j, --json', 'Output in JSON format')
         .action(async (input, output, options) => {
            const { conversionService } = await getServices();

            const inputPath = path.resolve(input);
            const outputPath = path.resolve(output);

            if (options.json) {
               outputJSON({
                  status: 'started',
                  input: inputPath,
                  output: outputPath,
                  format: options.format,
                  quality: options.quality
               });
            } else {
               outputText(`🔄 Converting: ${path.basename(input)}`);
               outputText(`   Format: ${options.format}`);
               outputText(`   Quality: ${options.quality}`);
            }

            try {
               await conversionService.start(
                  `cli-${Date.now()}`,
                  {
                     inputPath,
                     outputPath,
                     format: options.format,
                     quality: options.quality
                  },
                  (progress) => {
                     if (!options.json && progress.progress) {
                        outputProgress(progress.progress);
                     }
                  }
               );

               if (options.json) {
                  outputJSON({ status: 'completed', output: outputPath });
               } else {
                  outputText('');
                  outputSuccess(`Conversion complete: ${path.basename(output)}`);
               }
            } catch (error: any) {
               if (options.json) {
                  outputJSON({ status: 'failed', error: error.message });
               } else {
                  outputError(`Conversion failed: ${error.message}`);
               }
               process.exit(1);
            }

            app.quit();
         });
   }
}
