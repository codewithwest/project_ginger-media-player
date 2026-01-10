
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranscoderService } from '../../src/main/services/Transcoder';
import ffmpeg from 'fluent-ffmpeg';

// Mock fluent-ffmpeg
vi.mock('fluent-ffmpeg', () => {
  const ffmpeg = vi.fn().mockReturnValue({
    format: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    seekInput: vi.fn().mockReturnThis(),
    pipe: vi.fn(),
    kill: vi.fn(),
  });
  
  // Attach static methods
  (ffmpeg as any).setFfmpegPath = vi.fn();
  
  return { default: ffmpeg };
});

// Mock ffmpeg-static
vi.mock('ffmpeg-static', () => {
  return { default: '/mock/path/to/ffmpeg' };
});

describe('TranscoderService', () => {
  let transcoder: TranscoderService;

  beforeEach(() => {
    transcoder = new TranscoderService();
    vi.clearAllMocks();
  });

  it('createStream should initialize ffmpeg with correct path', () => {
    transcoder.createStream('/path/to/video.mkv');
    expect(ffmpeg).toHaveBeenCalledWith('/path/to/video.mkv');
  });

  it('createStream should set output format to mp4', () => {
    transcoder.createStream('/path/to/video.mkv');
    const mockffmpeg = (ffmpeg as unknown as jest.Mock).mock.results[0].value;
    expect(mockffmpeg.format).toHaveBeenCalledWith('mp4');
  });

  it('createStream should apply streaming options', () => {
    transcoder.createStream('/path/to/video.mkv');
    const mockffmpeg = (ffmpeg as unknown as jest.Mock).mock.results[0].value;
    expect(mockffmpeg.outputOptions).toHaveBeenCalledWith(
      expect.arrayContaining([
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-c:v libx264',
        '-tune zerolatency'
      ])
    );
  });

  it('createStream should seek if startTime is provided', () => {
    transcoder.createStream('/path/to/video.mkv', 60);
    const mockffmpeg = (ffmpeg as unknown as jest.Mock).mock.results[0].value;
    expect(mockffmpeg.seekInput).toHaveBeenCalledWith(60);
  });

  it('extractSubtitles should set format to webvtt', () => {
    transcoder.extractSubtitles('/path/to/video.mkv');
    const mockffmpeg = (ffmpeg as unknown as jest.Mock).mock.results[0].value;
    expect(mockffmpeg.outputOptions).toHaveBeenCalledWith(
      expect.arrayContaining(['-f webvtt'])
    );
  });
});
