// Main React application component

import { useEffect } from 'react';
import { Background3D } from './components/3d/Background3D';
import { PlayerControls } from './components/player/PlayerControls';
import { useMediaPlayerStore } from './state/media-player';
import { Disc3, FolderOpen } from 'lucide-react';
import { PlaylistSidebar } from './components/playlist/PlaylistSidebar';
import { VideoPlayer } from './components/player/VideoPlayer';

export function App() {
  const { setPlaybackState, addToPlaylist, playAtIndex, playlist, status, streamUrl } = useMediaPlayerStore();
  
  useEffect(() => {
    // Subscribe to playback state changes from Main process
    // Removed legacy IPC subscriptions since we handle local playback
    // But we might want to keep global shortcuts sync later
  }, []);
  
  const handleOpenFiles = async () => {
    const files = await window.electronAPI.file.openDialog();
    if (files && files.length > 0) {
      console.log('Opening files:', files);
      
      const newItems = files.map(filePath => ({
        id: filePath, // Using path as ID for now
        type: 'local' as const,
        path: filePath,
        title: filePath.split('/').pop()
      }));

      // Add all to playlist
      newItems.forEach(item => addToPlaylist(item));

      // If not playing, start playing the first new item
      if (status === 'stopped' || playlist.length === 0) {
        // We need the index of the first added item. 
        // If playlist was empty, it's 0. If it had items, it's old length.
        const startIndex = playlist.length; 
        // Wait a tick for state update? Zustand updates are sync usually but side effects might lag?
        // Actually, we called addToPlaylist which triggers a set.
        // But we can't access updated playlist generic from hook immediately in closure?
        // Let's just play at index we know.
         playAtIndex(startIndex);
      }
    }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col bg-dark-bg text-white">
      {/* Three.js Background */}
      <Background3D />
      
      {/* Title bar (macOS traffic lights area) */}
      <div className="h-12 flex items-center justify-center drag-region z-50">
        <h1 className="text-lg font-semibold text-gray-300">Ginger Media Player</h1>
      </div>
      
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative">
          
          {/* Video Player or Placeholder */}
          {streamUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <VideoPlayer key={streamUrl} />
            </div>
          ) : (
            /* Placeholder */
            <div className="flex flex-col items-center gap-6 mb-8 z-10">
              <div className="w-48 h-48 rounded-2xl bg-dark-surface flex items-center justify-center shadow-2xl">
                <Disc3 className="w-24 h-24 text-primary-500 animate-spin-slow" />
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">No Track Playing</h2>
                <p className="text-gray-400">Open a file to get started</p>
                <div className="mt-4">
                  <button
                    onClick={handleOpenFiles}
                    className="group flex items-center gap-2 px-4 py-2 bg-dark-elevated hover:bg-dark-border rounded-lg text-sm text-gray-300 transition-all duration-200 border border-white/5 hover:border-white/10"
                  >
                    <FolderOpen className="w-4 h-4 text-primary-500 group-hover:scale-110 transition-transform" />
                    <span>Open Media</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Floating Controls at Bottom */}
         <div className="absolute bottom-0 left-0 right-0 z-30 px-8 pb-8 pt-4 bg-gradient-to-t from-dark-bg via-dark-bg/90 to-transparent pointer-events-none">
            <div className="max-w-3xl mx-auto bg-dark-surface/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 pointer-events-auto">
              <PlayerControls />
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <PlaylistSidebar />
        
      </div>
      {/* Footer */}
      <div className="h-16 flex items-center justify-center text-sm text-gray-500 z-50 bg-dark-bg/50 backdrop-blur-sm">
        <p>Ginger Media Player v1.0.0 - Built with Electron, React & Three.js</p>
      </div>
    </div>
  );
}
