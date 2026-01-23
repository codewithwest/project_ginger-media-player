import { Command } from 'commander';
import { PlaybackCommands } from './commands/PlaybackCommands';
import { ConversionCommands } from './commands/ConversionCommands';
import { DownloadCommands } from './commands/DownloadCommands';
import { LibraryCommands } from './commands/LibraryCommands';
import { PlaylistCommands } from './commands/PlaylistCommands';

export class CommandRegistry {
   constructor(private program: Command) { }

   async registerAll(): Promise<void> {
      // Register all command groups
      new PlaybackCommands(this.program).register();
      new ConversionCommands(this.program).register();
      new DownloadCommands(this.program).register();
      new LibraryCommands(this.program).register();
      new PlaylistCommands(this.program).register();
   }
}
