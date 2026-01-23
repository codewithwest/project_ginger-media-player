import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Maximize, ListMusic } from 'lucide-react';
import { useMediaPlayerStore } from '../../state/media-player';

interface PlayerControlsProps {
  onToggleQueue?: () => void;
  queueVisible?: boolean;
}

export function PlayerControls({ onToggleQueue, queueVisible }: PlayerControlsProps) {
  const {
    status,
    shuffle,
    repeat,
    volume,
    position,
    duration,
    play,
    pause,
    seek,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    setVolume,
  } = useMediaPlayerStore();

  const isPlaying = status === 'playing';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value);
    seek(newPosition);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleToggleFullScreen = () => {
    window.electronAPI.window.toggleFullScreen();
  };

  return (
    <div className="flex flex-col gap-2 w-full animate-fade-in">
      {/* Progress Bar */}
      <div className="flex items-center gap-4 w-full px-2">
        <span className="text-[10px] text-gray-500 w-10 text-right font-mono tabular-nums">
          {formatTime(position)}
        </span>
        <div className="flex-1 relative group h-6 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={position}
            onChange={handleSeek}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer z-10
              accent-primary-500
              hover:accent-primary-400
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-0
              [&::-webkit-slider-thumb]:h-0
              group-hover:[&::-webkit-slider-thumb]:w-3
              group-hover:[&::-webkit-slider-thumb]:h-3
              group-hover:[&::-webkit-slider-thumb]:bg-white
              group-hover:[&::-webkit-slider-thumb]:rounded-full
              group-hover:[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]
              transition-all duration-200"
          />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 rounded-full pointer-events-none"
            style={{ width: `${(position / (duration || 100)) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 w-10 font-mono tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between w-full h-14">
        {/* Left: Secondary controls */}
        <div className="flex items-center gap-1 w-1/3">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-xl transition-all duration-300 ${shuffle ? 'text-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-xl transition-all duration-300 ${repeat !== 'off' ? 'text-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Main controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={previous}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 transform active:scale-90"
            title="Previous"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-14 h-14 rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-[0_8px_30px_rgb(255,255,255,0.2)]"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 ml-1 fill-current" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 transform active:scale-90"
            title="Next"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* Right: Volume & Extra */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <div className="flex items-center gap-2 group/vol">
            <Volume2 className="w-4 h-4 text-gray-500 group-hover/vol:text-gray-300 transition-colors" />
            <div className="w-20 relative h-1 bg-white/10 rounded-full overflow-hidden">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="h-full bg-gray-400 group-hover/vol:bg-primary-500 transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-2" />

          <button
            onClick={handleToggleFullScreen}
            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-all"
            title="Full Screen"
          >
            <Maximize className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleQueue}
            className={`p-2 rounded-xl transition-all ${queueVisible ? 'text-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Toggle Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
