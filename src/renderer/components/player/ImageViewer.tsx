import { useEffect, useState, useRef } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';
import { 
    Maximize, 
    Minimize, 
    ChevronLeft, 
    ChevronRight,
    Play,
    Pause,
    Clock,
    X
} from 'lucide-react';

export function ImageViewer() {
  const { currentSource, streamUrl, next, previous, status, pause, play } = useMediaPlayerStore();
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [intervalTime, setIntervalTime] = useState(5000);
  const slideshowTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSlideshowRunning && status === 'playing') {
        slideshowTimer.current = setInterval(() => {
            next();
        }, intervalTime);
    } else {
        if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    }

    return () => {
        if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    };
  }, [isSlideshowRunning, status, intervalTime, next]);

  if (!streamUrl || currentSource?.mediaType !== 'image') return null;

  const toggleSlideshow = () => {
      if (isSlideshowRunning) {
          setIsSlideshowRunning(false);
          pause();
      } else {
          setIsSlideshowRunning(true);
          play();
      }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-black/90 group overflow-hidden">
        
        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
                key={streamUrl}
                src={streamUrl}
                alt={currentSource.title}
                className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500"
            />
        </div>

        {/* Floating Controls (Top) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 glass-dark rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-6 z-30">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Now Viewing</span>
                <span className="text-xs font-bold text-white truncate max-w-[200px]">{currentSource.title}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleSlideshow}
                    className={`p-2 rounded-xl transition-all ${isSlideshowRunning ? 'bg-indigo-500 text-white shadow-glow-sm' : 'hover:bg-white/10 text-gray-400'}`}
                    title={isSlideshowRunning ? "Pause Slideshow" : "Start Slideshow"}
                >
                    {isSlideshowRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <select 
                        value={intervalTime}
                        onChange={(e) => setIntervalTime(Number(e.target.value))}
                        className="bg-transparent text-[10px] font-bold text-gray-300 outline-none"
                    >
                        <option value={3000}>3s</option>
                        <option value={5000}>5s</option>
                        <option value={10000}>10s</option>
                        <option value={30000}>30s</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Navigation Overlays */}
        <button 
            onClick={previous}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/5"
        >
            <ChevronLeft className="w-8 h-8" />
        </button>

        <button 
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/5"
        >
            <ChevronRight className="w-8 h-8" />
        </button>

    </div>
  );
}
