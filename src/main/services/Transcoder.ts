import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';


export class TranscoderService {
  constructor(ffmpegPath?: string) {
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      console.log('[Transcoder] Using custom ffmpeg path:', ffmpegPath);
    } else if (pathToFfmpeg) {
      ffmpeg.setFfmpegPath(pathToFfmpeg);
      console.log('[Transcoder] Falling back to default ffmpeg path:', pathToFfmpeg);
    } else {
      console.warn('[Transcoder] No ffmpeg path found!');
    }
  }
  /**
   * Creates a transcoding stream for a media file.
   * Converts unsupported formats to a streamable MP4 (fragmented) container.
   * If the format is mostly compatible, it will try to copy streams (remux) instead of re-encoding.
   */
  createStream(filePath: string, startTime = 0): ffmpeg.FfmpegCommand {
    const command = ffmpeg(filePath);

    // Seek to start time if needed
    if (startTime > 0) {
      command.seekInput(startTime);
    }

    // Default configuration: Output fragmented MP4
    // We want to minimize CPU usage, so we'll try to copy video if compatible (H.264)
    // and just convert audio to AAC if needed.
    // For now, to ensure compatibility, we'll use a standard preset.

    command
      .format('mp4')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov+default_base_moof', // Fragmented MP4 for streaming
        '-c:v libx264',             // Video codec (H.264)
        '-preset ultrafast',        // Fastest encoding speed (low CPU)
        '-tune zerolatency',        // Optimization for streaming
        '-c:a aac',                 // Audio codec (AAC)
        '-b:a 128k',                // Audio bitrate
        '-max_muxing_queue_size 1024' // Buffer size for muxing
      ])
      .on('error', (err) => {
        // Suppress "Output stream closed" errors which happen when client disconnects
        if (err.message.includes('Output stream closed')) return;
        console.error('Transcoding error:', err.message);
      });

    return command;
  }
  /**
   * Extracts subtitles from the media file and converts them to WebVTT format.
   * Returns a readable stream of the VTT content.
   */
  extractSubtitles(filePath: string): ffmpeg.FfmpegCommand {
    return ffmpeg(filePath)
      .outputOptions([
        '-map 0:s:0?', // Map the first subtitle stream if it exists
        '-f webvtt',   // Output format: WebVTT
      ])
      .on('error', (err) => {
        if (err.message.includes('Output stream closed')) return;
        console.error('Subtitle extraction error:', err.message);
      });
  }

  /**
   * Generates a thumbnail command for a media file (image or video).
   * For videos and GIFs, it takes the first frame.
   */
  createThumbnail(filePath: string): ffmpeg.FfmpegCommand {
    const ext = path.extname(filePath).toLowerCase();
    const isVideo = ['.mp4', '.mkv', '.webm', '.mov', '.avi'].includes(ext);
    const isGif = ext === '.gif';

    const command = ffmpeg(filePath).size('320x?');
    
    if (isVideo || isGif) {
      return command
        .seekInput(0)
        .frames(1);
    }
    
    return command;
  }
}
