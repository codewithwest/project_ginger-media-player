import { useMediaPlayerStore } from '../../state/media-player';
import { Play, Trash2, ListMusic, Plus } from 'lucide-react';

export function PlaylistSidebar() {
  const { 
    playlist, 
    currentIndex, 
    currentSource, 
    playAtIndex, 
    removeFromPlaylist,
    clearPlaylist,
    addToPlaylist,
    status
  } = useMediaPlayerStore();

  const handleAddFiles = async () => {
    const files = await window.electronAPI.file.openDialog();
    if (files && files.length > 0) {
      const newItems = files.map(filePath => ({
        id: filePath,
        type: 'local' as const,
        path: filePath,
        title: filePath.split('/').pop()
      }));
      newItems.forEach(item => addToPlaylist(item));
      
      // Auto-play if empty/stopped
      if (status === 'stopped' && playlist.length === 0) {
         // This might act on the next render store state? 
         // Since we can't reliably predict the index of the newly added item in this closure if we have async updates...
         // But let's assume if it WAS empty, index 0 is safe.
         // Actually, if playlist WAS empty, newItems[0] is at index 0.
         // We can try to play index 0 after a short timeout or just let user click.
         // Let's NOT auto-play from the sidebar "Add" button to avoid confusion, 
         // unless the user specifically clicked "Add to play".
      }
    }
  };

  if (playlist.length === 0) {
    return (
      <div className="w-80 h-full bg-dark-surface border-l border-dark-border p-4 flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="flex flex-col items-center">
          <ListMusic className="w-12 h-12 mb-2 opacity-50" />
          <p>Playlist Empty</p>
        </div>
        <button
          onClick={handleAddFiles}
          className="flex items-center gap-2 px-4 py-2 bg-dark-elevated hover:bg-dark-border rounded-lg text-sm text-gray-300 transition-colors border border-white/5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tracks</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-dark-surface border-l border-dark-border flex flex-col">
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
          <ListMusic className="w-4 h-4" />
          Queue ({playlist.length})
        </h2>
        <div className="flex items-center gap-2">
           <button
            onClick={handleAddFiles}
            className="p-1 hover:bg-dark-elevated rounded text-gray-400 hover:text-primary-400 transition-colors"
            title="Add Files"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={clearPlaylist}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-dark-elevated transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {playlist.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <div 
              key={`${item.id}-${index}`}
              className={`
                group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                ${isActive 
                  ? 'bg-primary-500/20 text-primary-200 border border-primary-500/30' 
                  : 'hover:bg-dark-elevated text-gray-400 hover:text-gray-200 border border-transparent'
                }
              `}
              onDoubleClick={() => playAtIndex(index)}
            >
              {/* Status Icon */}
              <div className="w-6 flex justify-center">
                {isActive ? (
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                ) : (
                  <span className="text-xs text-gray-600 group-hover:hidden">{index + 1}</span>
                )}
                <Play className="w-3 h-3 hidden group-hover:block text-gray-300" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.title || item.path.split('/').pop()}
                </p>
                <p className="text-xs opacity-60 truncate">
                  {item.artist || 'Unknown Artist'}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist(index);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
