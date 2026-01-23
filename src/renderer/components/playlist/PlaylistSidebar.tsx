
import React, { useState, useEffect } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';
import { Play, Trash2, ListMusic, Plus, Download, Folder } from 'lucide-react';

export function PlaylistSidebar() {
  const {
    playlist,
    currentIndex,
    playAtIndex,
    removeFromPlaylist,
    clearPlaylist,
    addToPlaylist
  } = useMediaPlayerStore();

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [downloadsPath, setDownloadsPath] = useState('');

  useEffect(() => {
    window.electronAPI.settings.get().then(settings => {
      if (settings?.downloadsPath) {
        setDownloadsPath(settings.downloadsPath);
      }
    });
  }, []);

  const handleAddFiles = async () => {
    const files = await window.electronAPI.file.openDialog();
    if (files && files.length > 0) {
      const newItems = files.map((filePath: any) => ({
        id: filePath,
        type: 'local' as const,
        path: filePath,
        title: typeof filePath === 'string' ? filePath.split('/').pop() || 'Unknown' : 'Unknown'
      }));
      newItems.forEach((item: any) => addToPlaylist(item));
    }
  };

  const handleChangeFolder = async () => {
    const newPath = await window.electronAPI.library.pickFolder();
    if (newPath) {
      setDownloadsPath(newPath);
      window.electronAPI.settings.update({ downloadsPath: newPath });
    }
  };

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      // Use the fetched downloads path or fallback
      const baseDir = downloadsPath || '/tmp';
      // Use yt-dlp template syntax for output path to let it decide filename from title
      const outputPath = `${baseDir}/%(title)s.%(ext)s`;

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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (playlist.length === 0) {
    return (
      <div className="w-80 h-full bg-[#1a1a1a] border-l border-[#333] p-4 flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="flex flex-col items-center">
          <ListMusic className="w-12 h-12 mb-2 opacity-50" />
          <p>Playlist Empty</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          {!showUrlInput ? (
            <>
              <button
                onClick={handleAddFiles}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition-colors border border-white/5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tracks</span>
              </button>
              <button
                onClick={toggleUrlInput}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition-colors border border-white/5"
              >
                <Download className="w-4 h-4" />
                <span>Download from URL</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
              <form onSubmit={handleDownloadSubmit} className="flex flex-col gap-2">
                <input
                  id="url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste Media URL..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm text-white"
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
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-white/5 p-2 rounded-lg border border-white/5 w-full">
                <Folder className="w-3 h-3 text-indigo-400" />
                <span className="truncate flex-1" title={downloadsPath}>{downloadsPath.split('/').pop() || 'Downloads'}</span>
                <button
                  onClick={handleChangeFolder}
                  className="text-indigo-400 hover:text-white transition-colors"
                  type="button"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#1a1a1a] border-l border-[#333] flex flex-col">
      <div className="p-4 border-b border-[#333] flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-200 flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            Queue ({playlist.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleUrlInput}
              className={`p-1 rounded transition-colors ${showUrlInput ? 'bg-indigo-500 text-white' : 'hover:bg-[#2a2a2a] text-gray-400 hover:text-indigo-400'}`}
              title="Download from URL"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddFiles}
              className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-indigo-400 transition-colors"
              title="Add Files"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={clearPlaylist}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        {showUrlInput && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200 p-1">
            <form onSubmit={handleDownloadSubmit} className="flex gap-2">
              <input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste URL..."
                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white"
              >
                Go
              </button>
            </form>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 p-1.5 rounded border border-white/5">
              <Folder className="w-3 h-3 text-indigo-400" />
              <span className="truncate flex-1" title={downloadsPath}>{downloadsPath.split('/').pop() || 'Downloads'}</span>
              <button
                onClick={handleChangeFolder}
                className="text-indigo-400 hover:text-white transition-colors"
                type="button"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {playlist.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <div key={index} className="">
              <div
                className={`
                    group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 h-[60px] border
                    ${isActive
                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                  }
                  `}
                onDoubleClick={() => playAtIndex(index)}
              >
                {/* Index / Status */}
                <div className="w-8 flex justify-center flex-shrink-0 text-xs font-medium">
                  {isActive ? (
                    <div className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 bg-indigo-400 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                      <span className="w-0.5 bg-indigo-400 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{ animationDelay: '0.2s', height: '60%' }} />
                      <span className="w-0.5 bg-indigo-400 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <span className="text-gray-600 group-hover:hidden font-mono">{index + 1}</span>
                  )}
                  <Play className={`w-3 h-3 text-gray-300 hidden group-hover:block ${isActive ? 'hidden' : ''}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-gray-300 group-hover:text-white'}`}>
                    {item.title || item.path.split('/').pop()}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">
                    <span className="truncate max-w-[120px]">{item.artist || 'Unknown Artist'}</span>
                    <span className="font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDuration(item.duration)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
