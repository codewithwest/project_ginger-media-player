import { useEffect, useState } from 'react';
import { useLibraryStore } from '../../state/library';
import { useMediaPlayerStore } from '../../state/media-player';
import { FolderPlus, Music, Play, X, Loader2, FileAudio, LayoutGrid, List } from 'lucide-react';

export function LibraryView({ onClose }: { onClose: () => void }) {
  const { folders, tracks, isLoading, loadLibrary, addFolder, removeFolder, scanLibrary } = useLibraryStore();
  const addToPlaylist = useMediaPlayerStore(state => state.addToPlaylist);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handlePlay = (track: any) => {
    addToPlaylist({
      id: track.id,
      path: track.path,
      type: 'local',
      title: track.title,
      artist: track.artist,
      duration: track.duration
    }, true); // Play immediately
  };

  const handleConvert = async (track: any) => {
    const outputPath = track.path.replace(/\.[^/.]+$/, "") + ".mp3";
    try {
      await window.electronAPI.jobs.startConversion({
        inputPath: track.path,
        outputPath,
        format: 'mp3',
        quality: 'high'
      });
      alert('Conversion started! Check the Jobs dashboard for progress.');
      // Auto-rescan after a delay to pick up the new file
      setTimeout(() => scanLibrary(), 2000);
    } catch (err) {
      console.error('Failed to start conversion:', err);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-[60] flex flex-col p-8 text-white animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your local collection</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className="flex gap-8 mb-8 flex-1 min-h-0">
        {/* Sidebar - Folders */}
        <div className="w-72 flex-shrink-0 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col glass">
          <h2 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-[0.2em]">Folders</h2>
          <div className="space-y-3 mb-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {folders.map(folder => (
              <div key={folder} className="group flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 text-sm transition-all border border-transparent hover:border-white/5">
                <span className="truncate font-medium text-gray-300" title={folder}>{folder.split('/').pop()}</span>
                <button
                  onClick={() => removeFolder(folder)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addFolder}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <FolderPlus className="w-5 h-5" />
            Add Folder
          </button>
        </div>

        {/* Main Content - Tracks */}
        <div className="flex-1 bg-white/5 rounded-3xl p-8 border border-white/10 overflow-hidden flex flex-col glass">
          <div className="flex justify-between items-center mb-8 flex-shrink-0">
            <h2 className="text-2xl font-bold">All Tracks <span className="text-gray-500 font-medium ml-2 text-lg">({tracks.length})</span></h2>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={scanLibrary}
                disabled={isLoading}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all
                  ${isLoading
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20'
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
          </div>

          {tracks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Music className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-lg font-medium">Your library is empty</p>
              <p className="text-sm text-gray-500 mt-1">Add a folder to start scanning your media.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {tracks.map((track, index) => (
                    <div key={track.id || index} className="group bg-black/40 hover:bg-white/5 p-4 rounded-2xl transition-all border border-white/5 hover:border-white/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Music className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate text-sm text-gray-200" title={track.title}>{track.title}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{track.artist || 'Unknown Artist'}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleConvert(track)}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
                          title="Convert to MP3"
                        >
                          <FileAudio className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePlay(track)}
                          className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-90"
                          title="Play Track"
                        >
                          <Play className="w-5 h-5 fill-white text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div key={track.id || index} className="group bg-black/40 hover:bg-white/5 p-3 rounded-xl transition-all border border-white/5 hover:border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-sm text-gray-200" title={track.title}>{track.title}</h3>
                        <p className="text-xs text-gray-500 font-medium">{track.artist || 'Unknown Artist'}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleConvert(track)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                          title="Convert to MP3"
                        >
                          <FileAudio className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePlay(track)}
                          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-90"
                          title="Play Track"
                        >
                          <Play className="w-4 h-4 fill-white text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
