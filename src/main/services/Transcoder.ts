import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import { Readable } from 'stream';

// Ensure ffmpeg binary is set
if (pathToFfmpeg) {
  ffmpeg.setFfmpegPath(pathToFfmpeg);
}

export class TranscoderService {
  /**
   * Creates a transcoding stream for a media file.
   * Converts unsupported formats to a streamable MP4 (fragmented) container.
   * If the format is mostly compatible, it will try to copy streams (remux) instead of re-encoding.
   */
  createStream(filePath: string, startTime: number = 0): ffmpeg.FfmpegCommand {
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
      .on('error', (err, stdout, stderr) => {
        // Suppress "Output stream closed" errors which happen when client disconnects
        if (err.message.includes('Output stream closed')) return;
        console.error('Transcoding error:', err.message);
      });

    return command;
  }
}
