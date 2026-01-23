
import { useEffect, useRef } from 'react';
import { useAudioEngine } from '../../state/audio-engine';
import { useMediaPlayerStore } from '../../state/media-player';

export function Visualizer() {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const status = useMediaPlayerStore(state => state.status);
   const animationRef = useRef<number>();

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const render = () => {
         // Get function directly to ensure it works with latest state without being a dependency
         const data = useAudioEngine.getState().getFrequencyData();
         const width = canvas.width;
         const height = canvas.height;

         ctx.clearRect(0, 0, width, height);

         if (!data || data.length === 0) {
            animationRef.current = requestAnimationFrame(render);
            return;
         }

         const barCount = data.length;
         const barWidth = (width / barCount);

         for (let i = 0; i < barCount; i++) {
            const barHeight = (data[i] / 255) * height;

            ctx.fillStyle = '#0ea5e9';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';

            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
         }

         animationRef.current = requestAnimationFrame(render);
      };

      if (status === 'playing') {
         animationRef.current = requestAnimationFrame(render);
      } else {
         if (animationRef.current) cancelAnimationFrame(animationRef.current);
         ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      return () => {
         if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
   }, [status]);

   return (
      <canvas
         ref={canvasRef}
         className="w-full h-32 opacity-80 pointer-events-none"
         width={600}
         height={128}
      />
   );
}
