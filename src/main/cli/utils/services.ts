import { ConversionService } from '../../services/ConversionService';
import { DownloadService } from '../../services/DownloadService';
import { LibraryService } from '../../services/LibraryService';
import { PlaylistService } from '../../services/PlaylistService';

let downloadService: DownloadService | null = null;
let conversionService: ConversionService | null = null;
let libraryService: LibraryService | null = null;
let playlistService: PlaylistService | null = null;

export async function getServices() {
   if (!downloadService) {
      downloadService = new DownloadService();
      await downloadService.init();

      const ffmpegPath = downloadService.getFFmpegPath();
      const ffprobePath = downloadService.getFFprobePath();

      conversionService = new ConversionService(ffmpegPath);
      libraryService = new LibraryService(ffprobePath);
      playlistService = new PlaylistService();
   }

   return {
      downloadService,
      conversionService: conversionService!,
      libraryService: libraryService!,
      playlistService: playlistService!
   };
}
