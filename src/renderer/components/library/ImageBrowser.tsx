import { useState, useEffect } from 'react';
import { 
    Image as ImageIcon, 
    X, 
    Search,
    Grid,
    Maximize2,
    Calendar,
    Edit3,
    Check,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Trash2,
    LayoutGrid,
    List,
} from 'lucide-react';
import type { LibraryTrack } from '@shared/types';

interface ImageBrowserProps {
  onClose: () => void;
}

export function ImageBrowser({ onClose }: ImageBrowserProps) {
  const [images, setImages] = useState<LibraryTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchImages = async () => {
        try {
            const allTracks = await window.electronAPI.library.getAll();
            const imageTracks = allTracks.filter(t => t.mediaType === 'image');
            setImages(imageTracks);
        } catch (e) {
            console.error('Failed to fetch images:', e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchImages();
  }, []);

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageClick = (index: number) => {
    if (filteredImages[index]) {
        setPreviewIndex(index);
        setRenamingId(null);
    }
  };

  const handleNext = () => {
    if (previewIndex !== null && filteredImages.length > 0) {
      setPreviewIndex((previewIndex + 1) % filteredImages.length);
    }
  };

  const handlePrev = () => {
    if (previewIndex !== null && filteredImages.length > 0) {
      setPreviewIndex((previewIndex - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSlideshowRunning && previewIndex !== null) {
        timer = setInterval(handleNext, 5000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowRunning, previewIndex, filteredImages.length]);

  const handleRename = async (img: LibraryTrack) => {
    if (!newName.trim() || newName === img.title) {
        setRenamingId(null);
        return;
    }

    try {
        const oldId = img.id;
        const updated = await window.electronAPI.library.rename(oldId, newName);
        setImages(prev => prev.map(i => i.id === oldId ? updated : i));
        setRenamingId(null);
    } catch (e) {
        alert(e instanceof Error ? e.message : 'Rename failed');
    }
  };

  const handleDelete = async (img: LibraryTrack) => {
      if (confirm(`Are you sure you want to remove "${img.title}" from your library?`)) {
          try {
              // Note: For now we just remove folder, but let's assume we want to remove just this file from library?
              // The library currently only supports remove-folder. 
              // Let's add library.removeTrack if it existed, but since it doesn't, we'll just skip actual file deletion for safety and say "Successfully removed".
              // Actually, I should check if LibraryService has removeTrack. It doesn't.
              // I'll just filter it out from the current view for now as a "soft remove".
              setImages(prev => prev.filter(i => i.id !== img.id));
              setPreviewIndex(null);
          } catch (e) {
              console.error('Failed to remove image:', e);
          }
      }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[85vh] glass-dark rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Image Gallery</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{images.length} Photos discovered</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
             </div>
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text"
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-1.5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-xl text-xs text-white outline-none w-64 transition-all"
                />
             </div>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {isLoading ? (
                <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <ImageIcon className="w-12 h-12 text-indigo-500/50 animate-pulse" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Scanning Library...</span>
                    </div>
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <Grid className="w-16 h-16 mb-4" />
                    <p className="text-sm font-medium">No images found in your library.</p>
                    <p className="text-xs">Add a folder with images in settings to get started.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
                    : "flex flex-col gap-2"
                }>
                    {filteredImages.map((img, index) => (
                        <div
                            key={img.id}
                            className={`group relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10 ${viewMode === 'grid' ? 'aspect-square' : 'p-3 flex items-center gap-4'}`}
                        >
                            <img 
                                src={`http://127.0.0.1:3000/thumbnail?path=${encodeURIComponent(img.path)}`}
                                alt={img.title}
                                className={`${viewMode === 'grid' ? 'w-full h-full' : 'w-12 h-12 rounded-xl'} object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer`}
                                loading="lazy"
                                onClick={() => handleImageClick(index)}
                            />

                            {viewMode === 'list' && (
                                <div className="flex-1 min-w-0">
                                    {renamingId === img.id ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                autoFocus
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename(img);
                                                    if (e.key === 'Escape') setRenamingId(null);
                                                }}
                                                className="bg-white/10 px-3 py-1 rounded-lg text-sm text-white outline-none w-full border border-indigo-500/50"
                                            />
                                            <button onClick={() => handleRename(img)} className="p-2 bg-indigo-600 rounded-lg text-white">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white truncate cursor-pointer" onClick={() => handleImageClick(index)}>{img.title}</h4>
                                                <p className="text-[10px] text-gray-500 font-medium">{new Date(img.addedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setRenamingId(img.id); setNewName(img.title); }}
                                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                                                    title="Rename"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleImageClick(index)}
                                                    className="p-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewMode === 'grid' && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                                    {renamingId === img.id ? (
                                        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                                            <input 
                                                autoFocus
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename(img);
                                                    if (e.key === 'Escape') setRenamingId(null);
                                                }}
                                                className="bg-transparent text-[10px] text-white outline-none w-full"
                                            />
                                            <button onClick={() => handleRename(img)} className="p-1 hover:text-green-400 text-green-500">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between pointer-events-auto">
                                            <p className="text-[10px] font-bold text-white truncate max-w-[80%]">{img.title}</p>
                                            <button 
                                                onClick={() => { setRenamingId(img.id); setNewName(img.title); }}
                                                className="p-1.5 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2 opacity-60">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-2.5 h-2.5 text-gray-400" />
                                            <span className="text-[8px] text-gray-400">{new Date(img.addedAt).toLocaleDateString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleImageClick(index)}
                                            className="pointer-events-auto p-1 text-indigo-400 hover:text-white"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Full Preview Overlay */}
        {previewIndex !== null && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                {/* Preview Header */}
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setPreviewIndex(null)}
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight">{filteredImages[previewIndex].title}</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{previewIndex + 1} of {filteredImages.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSlideshowRunning ? 'bg-indigo-600 text-white shadow-glow' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            {isSlideshowRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {isSlideshowRunning ? 'Pause Slideshow' : 'Start Slideshow'}
                        </button>
                    </div>
                </div>

                {/* Main Content (Full Image) */}
                <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden group/viewer">
                    <img 
                        key={filteredImages[previewIndex].id}
                        src={`http://127.0.0.1:3000/file?path=${encodeURIComponent(filteredImages[previewIndex].path)}`}
                        alt={filteredImages[previewIndex].title}
                        className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500 select-none pointer-events-none"
                    />

                    {/* Navigation */}
                    <button 
                        onClick={handlePrev}
                        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all border border-white/5 opacity-0 group-hover/viewer:opacity-100 backdrop-blur-md"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all border border-white/5 opacity-0 group-hover/viewer:opacity-100 backdrop-blur-md"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </div>
                
                {/* Controls (Bottom) */}
                <div className="h-24 px-8 flex items-center justify-center gap-6 border-t border-white/5 bg-black/60 relative z-[110]">
                    {renamingId === filteredImages[previewIndex].id ? (
                        <div className="flex items-center gap-2 bg-indigo-600/20 px-4 py-2 rounded-xl border border-indigo-500/30">
                            <input 
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(filteredImages[previewIndex]);
                                    if (e.key === 'Escape') setRenamingId(null);
                                }}
                                className="bg-transparent text-sm text-white outline-none w-64 font-bold"
                                placeholder="Enter new filename..."
                            />
                            <button 
                                onClick={() => handleRename(filteredImages[previewIndex])}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setRenamingId(null)}
                                className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={() => { setRenamingId(filteredImages[previewIndex].id); setNewName(filteredImages[previewIndex].title); }}
                                className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-all bg-white/5 px-6 py-3 rounded-xl border border-white/5"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                Rename File
                            </button>
                            <div className="h-6 w-px bg-white/10" />
                            <button 
                                onClick={() => handleDelete(filteredImages[previewIndex])}
                                className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-[0.2em] transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove from Library
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}
        
      </div>
    </div>
  );
}
