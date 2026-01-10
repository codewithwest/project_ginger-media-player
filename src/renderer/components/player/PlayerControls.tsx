// Player controls component

import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2 } from 'lucide-react';
import { useMediaPlayerStore } from '@renderer/state/media-player';

export function PlayerControls() {
  const {
    status,
    shuffle,
    repeat,
    volume,
    play,
    pause,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    setVolume,
  } = useMediaPlayerStore();
  
  const isPlaying = status === 'playing';
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      // For now, play a stub source
      play('stub-source-id');
    }
  };
  
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Main controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          className={`
            p-2 rounded-full transition-all duration-200
            ${shuffle 
              ? 'bg-primary-500 text-white shadow-glow' 
              : 'bg-dark-elevated text-gray-400 hover:text-white hover:bg-dark-border'
            }
          `}
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>
        
        {/* Previous */}
        <button
          onClick={previous}
          className="p-3 rounded-full bg-dark-elevated text-white hover:bg-dark-border transition-all duration-200 hover:scale-110"
          title="Previous"
        >
          <SkipBack className="w-6 h-6" />
        </button>
        
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className="p-5 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200 hover:scale-110 shadow-glow hover:shadow-glow-lg"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          )}
        </button>
        
        {/* Next */}
        <button
          onClick={next}
          className="p-3 rounded-full bg-dark-elevated text-white hover:bg-dark-border transition-all duration-200 hover:scale-110"
          title="Next"
        >
          <SkipForward className="w-6 h-6" />
        </button>
        
        {/* Repeat */}
        <button
          onClick={toggleRepeat}
          className={`
            p-2 rounded-full transition-all duration-200
            ${repeat !== 'off'
              ? 'bg-primary-500 text-white shadow-glow' 
              : 'bg-dark-elevated text-gray-400 hover:text-white hover:bg-dark-border'
            }
          `}
          title={`Repeat: ${repeat}`}
        >
          <Repeat className="w-5 h-5" />
        </button>
      </div>
      
      {/* Volume control */}
      <div className="flex items-center gap-3 px-4">
        <Volume2 className="w-5 h-5 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-dark-border rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-125"
        />
        <span className="text-sm text-gray-400 w-12 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
