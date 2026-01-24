import { useState } from 'react';
import { useJobsStore } from '../../state/jobs';
import { 
    FileVideo, 
    Music, 
    Settings2, 
    Play, 
    X, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Plus,
    Trash2,
    Folder
} from 'lucide-react';
import type { ConversionRequest } from '@shared/types';

interface ConverterViewProps {
  onClose: () => void;
}

export function ConverterView({ onClose }: ConverterViewProps) {
  const { jobs, startConversion, cancelJob } = useJobsStore();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [outputDir, setOutputDir] = useState<string>('');
  const [format, setFormat] = useState<'mp3' | 'aac' | 'flac' | 'wav'>('mp3');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');

  const handlePickOutputDir = async () => {
    const dir = await window.electronAPI.library.pickFolder();
    if (dir) {
      setOutputDir(dir);
    }
  };

  const handlePickFiles = async () => {
    const files = await window.electronAPI.file.openDialog();
    if (files && files.length > 0) {
      // Filter out files already in the list
      const newFiles = files.filter((f: string) => !selectedFiles.includes(f));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleStartConversion = async () => {
    if (selectedFiles.length === 0) return;

    for (const filePath of selectedFiles) {
        const fileName = filePath.split('/').pop() || 'output';
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        
        let finalOutputDir = outputDir;
        if (!finalOutputDir) {
            finalOutputDir = await window.electronAPI.app.getDownloadsPath();
        }
        
        const outputPath = `${finalOutputDir}/${baseName}.${format}`;

        const request: ConversionRequest = {
            inputPath: filePath,
            outputPath,
            format,
            quality
        };

        startConversion(request);
    }
    
    // Clear list after queueing
    setSelectedFiles([]);
  };

  const activeConversions = jobs.filter(j => j.type === 'conversion' && (j.status === 'running' || j.status === 'queued'));
  const completedConversions = jobs.filter(j => j.type === 'conversion' && (j.status === 'completed' || j.status === 'failed')).slice(0, 5);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[80vh] glass-dark rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-xl">
                <Music className="w-5 h-5 text-primary-500" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Audio Extractor</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Video to High-Quality Audio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Setup */}
            <div className="w-2/3 flex flex-col border-r border-white/5 p-6 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <FileVideo className="w-4 h-4" />
                            Source Videos
                        </h3>
                        <button 
                            onClick={handlePickFiles}
                            className="text-[10px] font-bold text-primary-500 hover:text-primary-400 transition-colors uppercase flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            Add Files
                        </button>
                    </div>

                    <div className="h-64 border border-white/5 bg-black/20 rounded-2xl overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {selectedFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                                <FileVideo className="w-12 h-12 mb-2" />
                                <p className="text-xs">No files selected</p>
                            </div>
                        ) : (
                            selectedFiles.map((file, i) => (
                                <div key={file} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl group">
                                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
                                        <FileVideo className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <span className="flex-1 text-xs text-gray-400 truncate">{file.split('/').pop()}</span>
                                    <button 
                                        onClick={() => handleRemoveFile(i)}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings2 className="w-3 h-3" />
                            Output Format
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['mp3', 'aac', 'flac', 'wav'].map((f: string) => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f as any)}
                                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                                        format === f 
                                        ? 'bg-primary-500/10 border-primary-500/50 text-white shadow-glow-sm' 
                                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Quality Preset
                        </label>
                        <div className="space-y-2">
                            {['high', 'medium', 'low'].map((q: string) => (
                                <button
                                    key={q}
                                    onClick={() => setQuality(q as any)}
                                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold text-left transition-all border ${
                                        quality === q 
                                        ? 'bg-primary-500/10 border-primary-500/50 text-white' 
                                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    {q.charAt(0).toUpperCase() + q.slice(1)} 
                                    <span className="text-[9px] ml-2 opacity-50">
                                        {format === 'mp3' ? (q === 'high' ? '320kbps' : q === 'medium' ? '192kbps' : '128kbps') : ''}
                                        {format === 'aac' ? (q === 'high' ? '256kbps' : q === 'medium' ? '160kbps' : '96kbps') : ''}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Folder className="w-3 h-3" />
                        Output Directory
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] text-gray-400 truncate">
                            {outputDir || 'Default: Downloads'}
                        </div>
                        <button 
                            onClick={handlePickOutputDir}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-gray-300 transition-all"
                        >
                            Change
                        </button>
                    </div>
                </div>

                <div className="mt-auto">
                    <button
                        onClick={handleStartConversion}
                        disabled={selectedFiles.length === 0}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary-900/40"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Start Extraction
                    </button>
                </div>
            </div>

            {/* Right Column: Queue/History */}
            <div className="w-1/3 flex flex-col bg-black/20 p-6 gap-6">
                <div className="flex flex-col h-full gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Jobs</h3>
                        <div className="space-y-3">
                            {activeConversions.length === 0 ? (
                                <p className="text-[10px] text-gray-600 italic">No active conversions</p>
                            ) : (
                                activeConversions.map(job => (
                                    <div key={job.jobId} className="space-y-2">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-[10px] text-gray-400 truncate">{job.title || 'Converting...'}</span>
                                            <span className="text-[10px] font-mono text-primary-500">{job.progress}%</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary-500 transition-all duration-300"
                                                style={{ width: `${job.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                             <span className="text-[8px] text-gray-600 uppercase font-bold">{job.status}</span>
                                             <button onClick={() => cancelJob(job.jobId)} className="text-[8px] text-red-500 hover:underline">Cancel</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent</h3>
                        <div className="space-y-2">
                            {completedConversions.map(job => (
                                <div key={job.jobId} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                                    {job.status === 'completed' ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 truncate leading-tight">{job.title}</p>
                                        <p className="text-[8px] text-gray-600 truncate">{job.outputFile?.split('/').pop()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
