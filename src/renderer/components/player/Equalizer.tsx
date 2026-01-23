
import { useAudioEngine } from '../../state/audio-engine';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface EqualizerProps {
   onClose: () => void;
}

const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const LABELS = ['60', '170', '310', '600', '1k', '3k', '6k', '12k', '14k', '16k'];

export function Equalizer({ onClose }: EqualizerProps) {
   const { eqBands, setEqBand } = useAudioEngine();

   const handleReset = () => {
      eqBands.forEach((_, i) => setEqBand(i, 0));
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
         <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden glass">

            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-500 rounded-xl shadow-lg shadow-primary-500/20">
                     <SlidersHorizontal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-white tracking-tight">Audio Equalizer</h2>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tune your frequency response</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button
                     onClick={handleReset}
                     className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                     title="Reset to Flat"
                  >
                     <RotateCcw className="w-4 h-4" />
                     Reset
                  </button>
                  <button
                     onClick={onClose}
                     className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                  >
                     <X className="w-6 h-6" />
                  </button>
               </div>
            </div>

            {/* EQ Sliders */}
            <div className="p-8 flex items-end justify-between gap-2 h-64">
               {BANDS.map((freq, i) => (
                  <div key={freq} className="flex flex-col items-center gap-4 flex-1 h-full">
                     <div className="text-[10px] font-mono text-gray-500 h-4">
                        {eqBands[i] > 0 ? `+${Math.round(eqBands[i])}` : Math.round(eqBands[i])}dB
                     </div>
                     <div className="flex-1 relative group w-full flex justify-center">
                        <input
                           type="range"
                           min="-12"
                           max="12"
                           step="0.5"
                           value={eqBands[i]}
                           onChange={(e) => setEqBand(i, parseFloat(e.target.value))}
                           className="h-full -rotate-90 appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-runnable-track]:h-1
                    [&::-webkit-slider-runnable-track]:bg-white/5
                    [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-primary-500
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(14,165,233,0.5)]
                    [&::-webkit-slider-thumb]:-mt-1
                    hover:[&::-webkit-slider-thumb]:scale-125
                    transition-all duration-200"
                           style={{ width: '160px' }}
                        />
                     </div>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {LABELS[i]}
                     </div>
                  </div>
               ))}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-white/5 flex items-center justify-center">
               <p className="text-[10px] text-gray-500 px-4 py-1 rounded-full border border-white/5">
                  10-Band Parametric Equalizer • v1.0
               </p>
            </div>
         </div>
      </div>
   );
}
