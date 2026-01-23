import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputJSON, outputText, outputProgress, outputSuccess, outputError } from '../../../src/main/cli/utils/output';

describe('CLI Output Utilities', () => {
   beforeEach(() => {
      vi.clearAllMocks();
   });

   describe('outputJSON', () => {
      it('should output valid JSON', () => {
         const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
         const data = { status: 'success', count: 5 };

         outputJSON(data);

         expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
      });

      it('should handle nested objects', () => {
         const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
         const data = {
            user: { name: 'Test', tracks: [1, 2, 3] },
            status: 'ok'
         };

         outputJSON(data);

         expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
      });
   });

   describe('outputText', () => {
      it('should output plain text', () => {
         const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

         outputText('Hello World');

         expect(consoleSpy).toHaveBeenCalledWith('Hello World');
      });
   });

   describe('outputProgress', () => {
      it('should output progress with carriage return', () => {
         const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

         outputProgress(50);

         expect(stdoutSpy).toHaveBeenCalledWith('\r   Progress: 50%');
      });

      it('should handle 0% progress', () => {
         const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

         outputProgress(0);

         expect(stdoutSpy).toHaveBeenCalledWith('\r   Progress: 0%');
      });

      it('should handle 100% progress', () => {
         const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

         outputProgress(100);

         expect(stdoutSpy).toHaveBeenCalledWith('\r   Progress: 100%');
      });
   });

   describe('outputSuccess', () => {
      it('should output success message with checkmark', () => {
         const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

         outputSuccess('Operation completed');

         expect(consoleSpy).toHaveBeenCalledWith('✅ Operation completed');
      });
   });

   describe('outputError', () => {
      it('should output error message with X mark', () => {
         const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

         outputError('Operation failed');

         expect(consoleSpy).toHaveBeenCalledWith('❌ Operation failed');
      });
   });
});
