// Main React application component

import { useEffect } from 'react';
import { Background3D } from './components/3d/Background3D';
import { PlayerControls } from './components/player/PlayerControls';
import { useMediaPlayerStore } from './state/media-player';
import { Disc3, FolderOpen } from 'lucide-react';

export function App() {
  const setPlaybackState = useMediaPlayerStore((state) => state.setPlaybackState);
  
  useEffect(() => {
    // Subscribe to playback state changes from Main process
    const unsubscribeState = window.electronAPI.media.onStateChanged((state) => {
      setPlaybackState(state);
    });
    
    const unsubscribeProgress = window.electronAPI.media.onProgress((data) => {
      setPlaybackState({ position: data.position, duration: data.duration });
    });
    
    return () => {
      unsubscribeState();
      unsubscribeProgress();
    };
  }, [setPlaybackState]);
  
  const handleOpenFiles = async () => {
    const files = await window.electronAPI.file.openDialog();
    if (files) {
      console.log('Selected files:', files);
      // TODO: Add to playlist
    }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col bg-dark-bg text-white">
      {/* Three.js Background */}
      <Background3D />
      
      {/* Title bar (macOS traffic lights area) */}
      <div className="h-12 flex items-center justify-center drag-region">
        <h1 className="text-lg font-semibold text-gray-300">Ginger Media Player</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Now playing area */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-48 h-48 rounded-2xl bg-dark-surface flex items-center justify-center shadow-2xl">
            <Disc3 className="w-24 h-24 text-primary-500 animate-spin-slow" />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">No Track Playing</h2>
            <p className="text-gray-400">Open a file to get started</p>
          </div>
        </div>
        
        {/* Player controls */}
        <div className="w-full max-w-2xl">
          <PlayerControls />
        </div>
        
        {/* Open files button */}
        <button
          onClick={handleOpenFiles}
          className="mt-8 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-full text-white font-medium transition-all duration-200 hover:scale-105 shadow-glow flex items-center gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Open Media Files
        </button>
      </div>
      
      {/* Footer */}
      <div className="h-16 flex items-center justify-center text-sm text-gray-500">
        <p>Ginger Media Player v1.0.0 - Built with Electron, React & Three.js</p>
      </div>
    </div>
  );
}
