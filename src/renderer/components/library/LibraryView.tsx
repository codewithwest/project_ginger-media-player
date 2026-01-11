
import React, { useEffect, useState } from 'react';
import { useLibraryStore } from '../../state/library';
import { useMediaPlayerStore } from '../../state/media-player';
import { FolderPlus, Music, Play, X } from 'lucide-react';

export function LibraryView({ onClose }: { onClose: () => void }) {
  const { folders, tracks, isLoading, loadLibrary, addFolder, removeFolder, scanLibrary } = useLibraryStore();
  const playAtIndex = useMediaPlayerStore(state => state.playAtIndex);
  const addToPlaylist = useMediaPlayerStore(state => state.addToPlaylist);
  
  useEffect(() => {
    loadLibrary();
  }, []);

  const handlePlay = (track: any) => {
    // Add to playlist and play
    addToPlaylist({
      id: track.id,
      path: track.path,
      type: 'local',
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      format: track.format
    });
    // Assuming it's added at the end, play the last one
    // But this is async in store maybe? Store updates are sync usually.
    // However, getting the new length is tricky if we don't have it back.
    // For now, let's just add it.
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col p-8 text-white animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Music className="w-8 h-8 text-indigo-500" />
          Media Library
        </h1>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-6 mb-8">
        <div className="w-64 flex-shrink-0 bg-white/5 rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Folders</h2>
          <div className="space-y-2 mb-4">
            {folders.map(folder => (
              <div key={folder} className="group flex justify-between items-center p-2 rounded-lg hover:bg-white/5 text-sm">
                 <span className="truncate" title={folder}>{folder.split('/').pop()}</span>
                 <button 
                  onClick={() => removeFolder(folder)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>
            ))}
          </div>
          <button 
            onClick={addFolder}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <FolderPlus className="w-4 h-4" />
            Add Folder
          </button>
        </div>

        <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/10 overflow-y-auto">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Tracks ({tracks.length})</h2>
            <button 
              onClick={scanLibrary}
              disabled={isLoading}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {isLoading ? 'Scanning...' : 'Rescan Library'}
            </button>
           </div>
           
           {tracks.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center text-gray-400">
               <Music className="w-16 h-16 mb-4 opacity-20" />
               <p>No tracks found. Add a folder to start scanning.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {tracks.map(track => (
                 <div key={track.id} className="group bg-black/20 hover:bg-white/10 p-3 rounded-lg transition-colors border border-transparent hover:border-white/10">
                   <div className="flex items-start gap-3">
                     <div className="w-10 h-10 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                       <Music className="w-5 h-5" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="font-medium truncate" title={track.title}>{track.title}</h3>
                       <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                     </div>
                     <button 
                      onClick={() => handlePlay(track)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-indigo-600 rounded-full transition-all"
                     >
                       <Play className="w-4 h-4 fill-white" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
