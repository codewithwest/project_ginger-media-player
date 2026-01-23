import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { PlaylistCommands } from '../../../src/main/cli/commands/PlaylistCommands';

// Mock dependencies
vi.mock('electron', () => ({
   app: {
      quit: vi.fn()
   }
}));

vi.mock('../../../src/main/cli/utils/services', () => ({
   getServices: vi.fn().mockResolvedValue({
      playlistService: {
         load: vi.fn().mockReturnValue([
            { id: '1', type: 'local', path: '/test/song1.mp3', title: 'Song 1' },
            { id: '2', type: 'local', path: '/test/song2.mp3', title: 'Song 2' }
         ]),
         save: vi.fn()
      }
   })
}));

vi.mock('../../../src/main/cli/utils/output', () => ({
   outputJSON: vi.fn(),
   outputText: vi.fn(),
   outputSuccess: vi.fn()
}));

describe('PlaylistCommands', () => {
   let program: Command;
   let playlistCommands: PlaylistCommands;

   beforeEach(() => {
      vi.clearAllMocks();
      program = new Command();
      playlistCommands = new PlaylistCommands(program);
   });

   describe('register', () => {
      it('should register playlist command', () => {
         playlistCommands.register();

         const commands = program.commands.map(cmd => cmd.name());
         expect(commands).toContain('playlist');
      });

      it('should register all options', () => {
         playlistCommands.register();

         const playlistCmd = program.commands.find(cmd => cmd.name() === 'playlist');
         const options = playlistCmd?.options.map(opt => opt.long);

         expect(options).toContain('--add');
         expect(options).toContain('--clear');
         expect(options).toContain('--list');
         expect(options).toContain('--json');
      });
   });

   describe('command execution', () => {
      it('should have correct description', () => {
         playlistCommands.register();

         const playlistCmd = program.commands.find(cmd => cmd.name() === 'playlist');
         expect(playlistCmd?.description()).toBe('Manage playlist');
      });
   });
});
