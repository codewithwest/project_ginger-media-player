import { useState, useEffect } from 'react';
import { useMediaPlayerStore } from '../../state/media-player';
import { 
    Image as ImageIcon, 
    X, 
    Search,
    Grid,
    Maximize2,
    Calendar,
} from 'lucide-react';
import type { LibraryTrack } from '@shared/types';

interface ImageBrowserProps {
  onClose: () => void;
}

export function ImageBrowser({ onClose }: ImageBrowserProps) {
  const [images, setImages] = useState<LibraryTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToPlaylist } = useMediaPlayerStore();

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

  const handleImageClick = async (img: LibraryTrack) => {
    const mediaSource = {
        id: img.id,
        type: 'local' as const,
        mediaType: 'image' as const,
        path: img.path,
        title: img.title
    };
    
    addToPlaylist(mediaSource, true);
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredImages.map((img) => (
                        <button
                            key={img.id}
                            onClick={() => handleImageClick(img)}
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5 hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10"
                        >
                            <img 
                                src={`http://127.0.0.1:3000/file?path=${encodeURIComponent(img.path)}`}
                                alt={img.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-[10px] font-bold text-white truncate">{img.title}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-2.5 h-2.5 text-gray-400" />
                                        <span className="text-[8px] text-gray-400">{new Date(img.addedAt).toLocaleDateString()}</span>
                                    </div>
                                    <Maximize2 className="w-3 h-3 text-indigo-400" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
      </div>
    </div>
  );
}
