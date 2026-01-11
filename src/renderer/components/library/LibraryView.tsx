
import React, { useEffect, CSSProperties } from 'react';
import { useLibraryStore } from '../../state/library';
import { useMediaPlayerStore } from '../../state/media-player';
import { FolderPlus, Music, Play, X, Loader2 } from 'lucide-react';
// import * as ReactWindow from 'react-window';
// import { AutoSizer } from 'react-virtualized-auto-sizer';

export function LibraryView({ onClose }: { onClose: () => void }) {
  const { folders, tracks, isLoading, loadLibrary, addFolder, removeFolder, scanLibrary } = useLibraryStore();
  const addToPlaylist = useMediaPlayerStore(state => state.addToPlaylist);
  
  useEffect(() => {
    loadLibrary();
  }, []);

  const handlePlay = (track: any) => {
    addToPlaylist({
      id: track.id,
      path: track.path,
      type: 'local',
      title: track.title,
      artist: track.artist,
      duration: track.duration
    });
  };

  const Cell = ({ columnIndex, rowIndex, style, data }: { columnIndex: number, rowIndex: number, style: CSSProperties, data: any }) => {
    const { tracks, columnCount } = data;
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= tracks.length) {
      return null;
    }

    const track = tracks[index];

    return (
      <div style={style}>
        <div className="group m-2 bg-black/20 hover:bg-white/10 p-3 rounded-lg transition-colors border border-transparent hover:border-white/10 h-[calc(100%-16px)]">
          <div className="flex items-start gap-3 h-full">
            <div className="w-10 h-10 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
              <h3 className="font-medium truncate text-sm" title={track.title}>{track.title}</h3>
              <p className="text-xs text-gray-400 truncate">{track.artist || 'Unknown'}</p>
            </div>
            <button 
              onClick={() => handlePlay(track)}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-indigo-600 rounded-full transition-all flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col p-8 text-white animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Music className="w-8 h-8 text-indigo-500" />
          Media Library
        </h1>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-6 mb-8 flex-1 min-h-0">
        <div className="w-64 flex-shrink-0 bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col">
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider flex-shrink-0">Folders</h2>
          <div className="space-y-2 mb-4 flex-1 overflow-y-auto custom-scrollbar">
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
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            Add Folder
          </button>
        </div>

        <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/10 overflow-hidden flex flex-col">
           <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold">All Tracks ({tracks.length})</h2>
            <button 
              onClick={scanLibrary}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                ${isLoading 
                  ? 'bg-indigo-500/10 text-indigo-400 cursor-not-allowed' 
                  : 'text-indigo-400 hover:text-white hover:bg-indigo-600'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                'Rescan Library'
              )}
            </button>
           </div>
           
           {tracks.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Music className="w-16 h-16 mb-4 opacity-20" />
               <p>No tracks found. Add a folder to start scanning.</p>
             </div>
           ) : (
             <div className="flex-1 overflow-y-auto no-scrollbar p-2">
               <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                 {tracks.map((track, index) => (
                   <div key={track.id || index} className="group bg-black/20 hover:bg-white/10 p-3 rounded-lg transition-colors border border-transparent hover:border-white/10 h-[90px]">
                     <div className="flex items-start gap-3 h-full">
                       <div className="w-10 h-10 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                         <Music className="w-5 h-5" />
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                         <h3 className="font-medium truncate text-sm text-gray-200" title={track.title}>{track.title}</h3>
                         <p className="text-xs text-gray-400 truncate">{track.artist || 'Unknown'}</p>
                       </div>
                       <button 
                         onClick={() => handlePlay(track)}
                         className="opacity-0 group-hover:opacity-100 p-2 hover:bg-indigo-600 rounded-full transition-all flex-shrink-0"
                       >
                         <Play className="w-4 h-4 fill-white text-white" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
