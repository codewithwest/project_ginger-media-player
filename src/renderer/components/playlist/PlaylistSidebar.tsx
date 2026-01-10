import { useState } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';
import { Play, Trash2, ListMusic, Plus, Download } from 'lucide-react';

export function PlaylistSidebar() {
  const { 
    playlist, 
    currentIndex, 
    playAtIndex, 
    removeFromPlaylist,
    clearPlaylist,
    addToPlaylist,
    status
  } = useMediaPlayerStore();

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

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
    }
  };

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const outputPath = `/tmp/download-${Date.now()}.mp4`; 
      window.electronAPI.jobs.startDownload({
        url: urlInput,
        outputPath, 
        format: 'best' 
      });
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
    if (!showUrlInput) {
       setTimeout(() => document.getElementById('url-input')?.focus(), 50);
    }
  };

  if (playlist.length === 0) {
    return (
      <div className="w-80 h-full bg-dark-surface border-l border-dark-border p-4 flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="flex flex-col items-center">
          <ListMusic className="w-12 h-12 mb-2 opacity-50" />
          <p>Playlist Empty</p>
        </div>
        
        {/* Buttons for empty state */}
        <div className="flex flex-col gap-3 w-full max-w-[200px]">
           {!showUrlInput ? (
             <>
                <button
                  onClick={handleAddFiles}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-elevated hover:bg-dark-border rounded-lg text-sm text-gray-300 transition-colors border border-white/5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tracks</span>
                </button>
                <button
                  onClick={toggleUrlInput}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-elevated hover:bg-dark-border rounded-lg text-sm text-gray-300 transition-colors border border-white/5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download from URL</span>
                </button>
             </>
           ) : (
             <form onSubmit={handleDownloadSubmit} className="flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                <input
                  id="url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste Media URL..."
                  className="w-full bg-dark-bg border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-500 rounded text-sm text-white"
                  >
                    Go
                  </button>
                  <button 
                    type="button"
                    onClick={toggleUrlInput}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                  >
                    Cancel
                  </button>
                </div>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-dark-surface border-l border-dark-border flex flex-col">
      <div className="p-4 border-b border-dark-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-200 flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            Queue ({playlist.length})
          </h2>
          <div className="flex items-center gap-2">
             <button
              onClick={toggleUrlInput}
              className={`p-1 rounded transition-colors ${showUrlInput ? 'bg-primary-500 text-white' : 'hover:bg-dark-elevated text-gray-400 hover:text-primary-400'}`}
              title="Download from URL"
            >
              <Download className="w-4 h-4" />
            </button>
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
        
        {/* URL Input Form */}
        {showUrlInput && (
          <form onSubmit={handleDownloadSubmit} className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
            <input
              id="url-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste URL..."
              className="flex-1 bg-dark-bg border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-500"
            />
            <button 
              type="submit"
              className="px-2 py-1 bg-primary-600 hover:bg-primary-500 rounded text-xs text-white"
            >
              Go
            </button>
          </form>
        )}
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
