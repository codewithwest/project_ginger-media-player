
import React, { useState, useEffect } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';
import { Play, Trash2, ListMusic, Plus, Download, Folder } from 'lucide-react';
import type { PlaylistItem } from '@shared/types';

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
      const newItems: PlaylistItem[] = files.map((filePath: string) => ({
        id: filePath,
        type: 'local' as const,
        path: filePath,
        title: typeof filePath === 'string' ? filePath.split('/').pop() || 'Unknown' : 'Unknown'
      }));
      newItems.forEach((item: PlaylistItem) => addToPlaylist(item));
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
      const baseDir = downloadsPath || '/tmp';
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

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="p-6 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Queue
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              {playlist.length} {playlist.length === 1 ? 'Track' : 'Tracks'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleUrlInput}
              className={`p-2 rounded-xl transition-all duration-300 ${showUrlInput ? 'bg-primary-500 text-white shadow-glow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Download from URL"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddFiles}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
              title="Add Files"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={clearPlaylist}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        {showUrlInput && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-2xl bg-white/5 border border-white/5">
            <form onSubmit={handleDownloadSubmit} className="flex gap-2">
              <input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste Media URL..."
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                Go
              </button>
            </form>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <Folder className="w-3 h-3 text-primary-500" />
              <span className="truncate flex-1" title={downloadsPath}>{downloadsPath.split('/').pop() || 'Downloads'}</span>
              <button
                onClick={handleChangeFolder}
                className="text-primary-500 hover:text-primary-400 transition-colors font-bold"
                type="button"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-1">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <ListMusic className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Your queue is empty</p>
            <p className="text-gray-600 text-xs mt-1">Add tracks to start listening</p>
          </div>
        ) : (
          playlist.map((item, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={index}
                className={`
                  group relative flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300
                  ${isActive
                    ? 'bg-white/10 border-white/10 shadow-xl scale-[1.02] z-10'
                    : 'hover:bg-white/5 hover:translate-x-1 border-transparent'
                  }
                  border
                `}
                onDoubleClick={() => playAtIndex(index)}
              >
                {/* Visual Indicator */}
                <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center flex-shrink-0">
                  {isActive ? (
                    <div className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 bg-primary-500 animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                      <span className="w-0.5 bg-primary-500 animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.2s', height: '60%' }} />
                      <span className="w-0.5 bg-primary-500 animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-600 group-hover:hidden font-mono">{index + 1}</span>
                  )}
                  <Play className={`w-3 h-3 text-white hidden group-hover:block ${isActive ? 'hidden' : ''} fill-current`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary-400' : 'text-gray-300 group-hover:text-white'}`}>
                    {item.title || item.path?.split('/').pop() || 'Unknown Track'}
                  </p>
                  <p className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate uppercase tracking-wider font-medium">
                    {item.artist || 'Unknown Artist'}
                  </p>
                </div>

                {/* Duration / Delete */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono text-gray-600 group-hover:hidden">
                    {formatDuration(item.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
