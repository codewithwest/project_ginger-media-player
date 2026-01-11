// Main React application component

import { useEffect, useState } from 'react';
import { Background3D } from './components/3d/Background3D';
import { PlayerControls } from './components/player/PlayerControls';
import { useMediaPlayerStore } from './state/media-player';
import { Disc3, FolderOpen, Activity } from 'lucide-react';
import { PlaylistSidebar } from './components/playlist/PlaylistSidebar';
import { VideoPlayer } from './components/player/VideoPlayer';
import { JobsView } from './components/jobs/JobsView';

export function App() {
  const { setPlaybackState, addToPlaylist, playAtIndex, playlist, status, streamUrl } = useMediaPlayerStore();
  const [showJobs, setShowJobs] = useState(false);
  
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
  
  // Handle CLI file opening
  useEffect(() => {
    const cleanup = window.electronAPI.file.onFileOpenFromCLI(async (filePath) => {
      console.log('Received file from CLI:', filePath);
      // Determine type (local file or url?)
      // For now assume path is local if not starting with http
      const isUrl = filePath.startsWith('http');
      
      // If it's a URL, maybe we download logic or stream?
      // For simple playback, treat as ID.
      // Reuse handleOpenFiles logic mostly.
      
      const newItem = {
        id: filePath,
        type: 'local' as const, // or 'url'
        path: filePath,
        title: filePath.split('/').pop() || filePath
      };
      
      useMediaPlayerStore.getState().addToPlaylist(newItem);
      // Play immediately?
      // Find index
      const state = useMediaPlayerStore.getState();
      const index = state.playlist.length - 1; // It was just added
      state.playAtIndex(index);
    });
    
    return cleanup;
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Three.js Background */}
      <Background3D />

      {/* Title Bar - Draggable */}
      <div className="h-8 w-full bg-black/40 flex items-center px-4 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="text-xs font-medium text-gray-400 tracking-wider">GINGER</div>
        <div className="flex-1" />
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
           <button 
             onClick={() => setShowJobs(!showJobs)}
             className={`p-1 rounded hover:bg-white/10 ${showJobs ? 'text-blue-400' : 'text-gray-400'}`}
             title="Show Jobs"
           >
             <Activity className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Playlist Sidebar */}
        <PlaylistSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-gray-900 to-black">
          {/* Main Stage (Player) */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {streamUrl ? (
              <VideoPlayer key={streamUrl} />
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
          </div>
        </div>
        
        {/* Jobs Sidebar (Right) */}
        {showJobs && (
          <div className="w-80 h-full border-l border-white/5 bg-black/40 backdrop-blur-md transition-all">
            <JobsView />
          </div>
        )}
      </div>
      
      {/* Footer / Controls overlay logic ... */}
      <div className="h-24 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 inset-x-0 z-30 pointer-events-none">
         <div className="w-full h-full flex items-center px-6 pointer-events-auto">
           <PlayerControls />
         </div>
      </div>
    </div>
  );
}
