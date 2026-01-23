import React, { useEffect, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { X, FileText, ChevronRight, Tag, Calendar, Rocket, Layers, CheckCircle2 } from 'lucide-react';

export function ReleasesView({ onClose }: { onClose: () => void }) {
  const [releases, setReleases] = useState<string[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
  }, []);

  useEffect(() => {
    if (selectedRelease) {
      loadContent(selectedRelease);
    }
  }, [selectedRelease]);

  const loadReleases = async () => {
    try {
      const list = await window.electronAPI.releases.list();
      setReleases(list);
      if (list.length > 0) {
        setSelectedRelease(list[0]);
      }
    } catch (e) {
      console.error('Failed to load releases', e);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (filename: string) => {
    try {
      const text = await window.electronAPI.releases.getContent(filename);
      setContent(text);
    } catch (e) {
      console.error('Failed to load content', e);
    }
  };

  // Custom Markdown Components
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const MarkdownComponents: Components = {
    h1: ({ node: _node, ...props }) => (
      <div className="mb-8 pb-4 border-b border-white/10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x" {...props} />
      </div>
    ),
    h2: ({ node: _node, ...props }) => (
      <div className="mt-10 mb-6 flex items-center gap-3">
        <div className="h-8 w-1 bg-indigo-500 rounded-full" />
        <h2 className="text-2xl font-semibold text-white/90" {...props} />
      </div>
    ),
    h3: ({ node: _node, ...props }) => (
      <h3 className="text-lg font-medium text-indigo-300 mt-6 mb-3 flex items-center gap-2" {...props} />
    ),
    ul: ({ node: _node, ...props }) => (
      <ul className="space-y-3 mb-6" {...props} />
    ),
    li: ({ node: _node, children, ...props }) => (
      <li className="flex items-start gap-3 text-gray-300 group" {...props}>
        <CheckCircle2 className="w-5 h-5 text-indigo-500/50 mt-0.5 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
        <span className="leading-relaxed">{children}</span>
      </li>
    ),
    p: ({ node: _node, ...props }) => (
      <p className="text-gray-300 leading-7 mb-4" {...props} />
    ),
    code: ({ node: _node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      // Cast props to check for inline, as it might be passed but not in types
      const isInline = (props as unknown as { inline?: boolean }).inline;
      return !isInline ? (
        <div className="relative group my-6">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-xl blur-lg group-hover:bg-indigo-500/10 transition-colors" />
          <div className="relative bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden">
             <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="text-xs font-mono text-gray-500 uppercase">{match?.[1] || 'sh'}</div>
             </div>
             <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-200">
               <code className={className} {...props}>
                 {children}
               </code>
             </pre>
          </div>
        </div>
      ) : (
        <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-sm text-indigo-300 border border-white/5" {...props}>
          {children}
        </code>
      );
    },
    blockquote: ({ node: _node, ...props }) => (
      <div className="relative pl-6 py-2 my-6 border-l-4 border-indigo-500 bg-indigo-500/5 rounded-r-lg">
        <blockquote className="text-gray-300 italic" {...props} />
      </div>
    ),
    hr: () => <hr className="my-10 border-white/10" />
  };

  return (
    <div className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-2xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center px-8 py-6 border-b border-white/10 bg-white/5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Rocket className="w-6 h-6 text-indigo-400" />
            </div>
            Release Notes
          </h1>
          <p className="text-sm text-gray-400 mt-1 ml-13">Updates, features, and improvements</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95 group"
        >
          <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 overflow-y-auto bg-black/20 p-4 flex flex-col gap-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : releases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Layers className="w-12 h-12 mb-4 opacity-20" />
              <p>No releases found</p>
            </div>
          ) : (
            releases.map((file, index) => {
               // Parsing logic
               const version = file.match(/v?(\d+\.\d+\.\d+)/)?.[1] || file.replace('RELEASE_NOTES_', '').replace('.md', '').replace('#', '');
               const isLatest = index === 0;
               const isSelected = selectedRelease === file;

               return (
                 <button
                   key={file}
                   onClick={() => setSelectedRelease(file)}
                   className={`
                     group relative p-4 rounded-xl text-left transition-all duration-200 border
                     ${isSelected 
                       ? 'bg-indigo-600/10 border-indigo-500/50 shadow-glow' 
                       : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                     }
                   `}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <span className={`text-lg font-bold ${isSelected ? 'text-indigo-400' : 'text-gray-200'}`}>
                       v{version}
                     </span>
                     {isLatest && (
                       <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                         Latest
                       </span>
                     )}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-400">
                     <Calendar className="w-3 h-3" />
                     <span>Released recently</span>
                   </div>
                   
                   {isSelected && (
                     <div className="absolute right-4 bottom-4">
                       <ChevronRight className="w-4 h-4 text-indigo-400 animate-slide-right" />
                     </div>
                   )}
                 </button>
               );
            })
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#0a0a0a] to-[#111]">
           <div className="max-w-4xl mx-auto p-12">
             {selectedRelease ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ReactMarkdown components={MarkdownComponents}>
                    {content}
                  </ReactMarkdown>
                  
                  {/* Footer for content */}
                  <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <Tag className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500">
                      End of Release Notes
                    </p>
                  </div>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                   <FileText className="w-24 h-24 mb-4 stroke-1" />
                   <div className="text-xl">Select a version to view details</div>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
