import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the services with classes so new Service() works
vi.mock('../../../src/main/services/DownloadService', () => {
   return {
      DownloadService: class {
         init = vi.fn().mockResolvedValue(undefined);
         getFFmpegPath = vi.fn().mockReturnValue('/mock/ffmpeg');
         getFFprobePath = vi.fn().mockReturnValue('/mock/ffprobe');
      }
   };
});

vi.mock('../../../src/main/services/ConversionService', () => {
   return {
      ConversionService: class {
         start = vi.fn().mockResolvedValue(undefined);
      }
   };
});

vi.mock('../../../src/main/services/LibraryService', () => {
   return {
      LibraryService: class {
         addFolder = vi.fn().mockResolvedValue(undefined);
         scan = vi.fn().mockResolvedValue([]);
         getTracks = vi.fn().mockReturnValue([]);
      }
   };
});

vi.mock('../../../src/main/services/PlaylistService', () => {
   return {
      PlaylistService: class {
         load = vi.fn().mockReturnValue([]);
         save = vi.fn();
      }
   };
});

describe('CLI Services Utility', () => {
   beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules(); // This is the key!
   });

   describe('getServices', () => {
      it('should initialize all services on first call', async () => {
         // Re-import the module to get a fresh state
         const { getServices } = await import('../../../src/main/cli/utils/services');
         const services = await getServices();

         expect(services).toHaveProperty('downloadService');
         expect(services).toHaveProperty('conversionService');
         expect(services).toHaveProperty('libraryService');
         expect(services).toHaveProperty('playlistService');
      });

      it('should return the same instances on subsequent calls (singleton)', async () => {
         const { getServices } = await import('../../../src/main/cli/utils/services');
         const services1 = await getServices();
         const services2 = await getServices();

         expect(services1.downloadService).toBe(services2.downloadService);
         expect(services1.conversionService).toBe(services2.conversionService);
         expect(services1.libraryService).toBe(services2.libraryService);
         expect(services1.playlistService).toBe(services2.playlistService);
      });

      it('should initialize DownloadService first', async () => {
         const { getServices } = await import('../../../src/main/cli/utils/services');
         const services = await getServices();

         expect(services.downloadService.init).toHaveBeenCalled();
      });

      it('should pass FFmpeg paths to ConversionService and LibraryService', async () => {
         const { getServices } = await import('../../../src/main/cli/utils/services');
         const services = await getServices();

         expect(services.downloadService.getFFmpegPath).toHaveBeenCalled();
         expect(services.downloadService.getFFprobePath).toHaveBeenCalled();
      });
   });
});
