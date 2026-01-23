import { useEffect, useRef, useState } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    streamUrl,
    status,
    volume,
    position,
    setPlaybackState,
    play,
    pause,
  } = useMediaPlayerStore();

  // Sync Play/Pause/Stop status
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (status === 'playing') {
      video.play().catch(err => console.error("Playback failed", err));
    } else if (status === 'paused') {
      video.pause();
    } else if (status === 'stopped') {
      video.pause();
      video.currentTime = 0;
    }
  }, [status]);

  // Sync Volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  // Sync Seek (Position) - careful to avoid loops
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only seek if the difference is significant (> 0.5s) to avoid fighting with timeUpdate
    if (Math.abs(video.currentTime - position) > 0.5) {
      video.currentTime = position;
    }
  }, [position]);

  // Handle events from Video Element
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlaybackState({ position: videoRef.current.currentTime });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlaybackState({
        duration: videoRef.current.duration
      });
      // If we were supposed to be playing, ensure we play
      if (status === 'playing') {
        videoRef.current.play().catch(e => console.error("Auto-play failed", e));
      }
    }
  };

  const handleEnded = () => {
    setPlaybackState({ status: 'stopped', position: 0 });
  };

  if (!streamUrl) return null;

  /* New state for subtitles */
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const { currentSource } = useMediaPlayerStore(); // Need access to the source file path

  useEffect(() => {
    async function loadSubtitles() {
      if (currentSource?.path) {
        try {
          const url = await window.electronAPI.media.getSubtitlesUrl(currentSource.path);
          setSubtitleUrl(url);
        } catch (e) {
          console.error("Failed to load subtitles", e);
          setSubtitleUrl(null);
        }
      } else {
        setSubtitleUrl(null);
      }
    }
    loadSubtitles();
  }, [currentSource?.path]);

  // ... previous effects ...

  const handleError = (e: any) => {
    const error = e.target.error;
    console.error("Video player error:", {
      code: error?.code,
      message: error?.message,
      src: videoRef.current?.src
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative group">
      <video
        ref={videoRef}
        src={streamUrl}
        crossOrigin="anonymous"
        className="max-w-full max-h-full object-contain shadow-2xl"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onClick={() => status === 'playing' ? pause() : play()}
      >
        {subtitleUrl && (
          <track
            label="English"
            kind="subtitles"
            srcLang="en"
            src={subtitleUrl}
            default
          />
        )}
      </video>
    </div>
  );
}
