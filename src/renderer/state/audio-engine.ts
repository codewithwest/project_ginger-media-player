
import { create } from 'zustand';

interface AudioEngineState {
   audioContext: AudioContext | null;
   sourceNode: MediaElementAudioSourceNode | null;
   analyser: AnalyserNode | null;
   eqNodes: BiquadFilterNode[];

   // Settings
   eqBands: number[]; // Gain values for each band

   // Actions
   init: (element: HTMLMediaElement) => void;
   setEqBand: (index: number, gain: number) => void;
   getFrequencyData: () => Uint8Array;
}

const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const useAudioEngine = create<AudioEngineState>((set, get) => ({
   audioContext: null,
   sourceNode: null,
   analyser: null,
   eqNodes: [],
   eqBands: new Array(BANDS.length).fill(0),

   init: (element: HTMLMediaElement) => {
      let { audioContext, sourceNode, analyser, eqNodes } = get();

      if (!audioContext) {
         audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Connect source
      if (sourceNode) {
         sourceNode.disconnect();
      }

      try {
         sourceNode = audioContext.createMediaElementSource(element);
      } catch (e) {
         // Source already created for this element, reuse? 
         // In React, elements might change. But typically video tags are reused.
         console.warn("Audio source already attached", e);
      }

      if (!analyser) {
         analyser = audioContext.createAnalyser();
         analyser.fftSize = 256;
      }

      // Create EQ nodes if not exists
      if (eqNodes.length === 0) {
         eqNodes = BANDS.map((freq, i) => {
            const node = audioContext!.createBiquadFilter();
            if (i === 0) {
               node.type = 'lowshelf';
            } else if (i === BANDS.length - 1) {
               node.type = 'highshelf';
            } else {
               node.type = 'peaking';
               node.Q.value = 1;
            }
            node.frequency.value = freq;
            node.gain.value = get().eqBands[i];
            return node;
         });
      }

      // Chain: Source -> EQ1 -> EQ2 -> ... -> EQN -> Analyser -> Destination
      let lastNode: AudioNode = sourceNode!;
      eqNodes.forEach(node => {
         lastNode.connect(node);
         lastNode = node;
      });

      lastNode.connect(analyser);
      analyser.connect(audioContext.destination);

      set({ audioContext, sourceNode, analyser, eqNodes });
   },

   setEqBand: (index, gain) => {
      const { eqNodes, eqBands } = get();
      if (eqNodes[index]) {
         eqNodes[index].gain.value = gain;
         const newBands = [...eqBands];
         newBands[index] = gain;
         set({ eqBands: newBands });
      }
   },

   getFrequencyData: () => {
      const { analyser } = get();
      if (!analyser) return new Uint8Array(0);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
   }
}));
