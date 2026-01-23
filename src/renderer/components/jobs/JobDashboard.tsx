import { useState } from 'react';
import { useJobsStore } from '../../state/jobs';
import {
   X,
   Download,
   RefreshCw,
   Trash2,
   Play,
   CheckCircle,
   AlertCircle,
   Clock,
   ExternalLink,
   Folder
} from 'lucide-react';
import { useMediaPlayerStore } from '../../state/media-player';
import { Job, DownloadRequest } from '../../../shared/types/media';

interface JobDashboardProps {
   onClose: () => void;
}

export function JobDashboard({ onClose }: JobDashboardProps) {
   const { jobs, removeJob, clearHistory } = useJobsStore();
   const { addToPlaylist, playAtIndex } = useMediaPlayerStore();
   const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

   const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
   const historyJobs = jobs.filter(j => j.status !== 'running' && j.status !== 'queued');

   const displayJobs = activeTab === 'active' ? activeJobs : historyJobs;

   const handlePlayJob = (job: Job) => {
      if (job.status === 'completed') {
         const filePath = job.outputFile || (job.details as any).outputPath;

         console.log(`[JobDashboard] Attempting to play job: ${job.jobId}`, {
            title: job.title,
            outputFile: job.outputFile,
            fallbackPath: (job.details as any).outputPath
         });

         if (filePath && !filePath.includes('%') && filePath.length > 5) {
            const newItem = {
               id: `${job.jobId}-${Date.now()}`,
               type: 'local' as const,
               path: filePath,
               title: job.title || filePath.split('/').pop() || 'Downloaded Media'
            };

            console.log(`[JobDashboard] Adding to playlist:`, newItem);
            addToPlaylist(newItem);

            // Ensure we play the item we just added
            setTimeout(() => {
               const currentPlaylist = useMediaPlayerStore.getState().playlist;
               playAtIndex(currentPlaylist.length - 1);
            }, 100);

            onClose();
         } else {
            console.error(`[JobDashboard] Cannot play job: Invalid or missing file path: "${filePath}"`);
         }
      }
   };

   const handleCancel = (jobId: string) => {
      window.electronAPI.jobs.cancel(jobId);
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="w-full max-w-4xl h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
               <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                     <Download className="w-7 h-7 text-blue-400" />
                     Download Manager
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">Monitor and manage your background tasks</p>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
               >
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Tabs & Controls */}
            <div className="px-8 py-4 bg-black/20 flex items-center justify-between">
               <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 font-sans">
                  <button
                     onClick={() => setActiveTab('active')}
                     className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                  >
                     Active ({activeJobs.length})
                  </button>
                  <button
                     onClick={() => setActiveTab('history')}
                     className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                  >
                     History ({historyJobs.length})
                  </button>
               </div>

               <button
                  onClick={clearHistory}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-400/10 rounded-lg transition-all"
               >
                  <Trash2 className="w-4 h-4" />
                  Clear Completed
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar">
               {displayJobs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
                     <RefreshCw className="w-16 h-16 animate-spin-slow" />
                     <p className="text-lg">No {activeTab} tasks found</p>
                  </div>
               ) : (
                  displayJobs.map((job) => (
                     <div
                        key={job.jobId}
                        className="bg-black/30 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
                     >
                        <div className="flex items-start gap-4">
                           {/* Status Icon */}
                           <div className={`mt-1 p-3 rounded-xl ${job.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                              job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                 'bg-blue-500/10 text-blue-400'
                              }`}>
                              {job.status === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                                 job.status === 'failed' ? <AlertCircle className="w-6 h-6" /> :
                                    job.type === 'download' ? <Download className="w-6 h-6 animate-bounce-subtle" /> :
                                       <RefreshCw className="w-6 h-6 animate-spin" />}
                           </div>

                           {/* Info */}
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                 <h3 className="font-semibold text-white truncate text-lg pr-4">
                                    {job.title || (job.status === 'completed' ? (job.outputFile?.split('/').pop() || 'Finished Task') :
                                       (job.details as DownloadRequest).url || 'Processing Media...')}
                                 </h3>
                                 <div className="flex items-center gap-2">
                                    {job.status === 'completed' && job.outputFile && (
                                       <button
                                          onClick={() => handlePlayJob(job)}
                                          className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all flex items-center gap-2 px-4"
                                       >
                                          <Play className="w-4 h-4 flex-shrink-0" />
                                          <span className="text-xs font-bold">PLAY</span>
                                       </button>
                                    )}
                                    {(job.status === 'running' || job.status === 'queued') && (
                                       <button
                                          onClick={() => handleCancel(job.jobId)}
                                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                          title="Cancel Task"
                                       >
                                          <X className="w-5 h-5" />
                                       </button>
                                    )}
                                    {job.status !== 'running' && job.status !== 'queued' && (
                                       <button
                                          onClick={() => removeJob(job.jobId)}
                                          className="p-2 hover:bg-white/10 text-gray-500 hover:text-white rounded-lg transition-all"
                                          title="Remove from history"
                                       >
                                          <Trash2 className="w-5 h-5" />
                                       </button>
                                    )}
                                 </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                 <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(job.createdAt).toLocaleTimeString()}
                                 </span>
                                 {job.type === 'download' && (
                                    <span className="flex items-center gap-1 max-w-[200px] truncate">
                                       <ExternalLink className="w-4 h-4" />
                                       {(job.details as DownloadRequest).url}
                                    </span>
                                 )}
                                 {(job.status === 'completed' || job.status === 'failed') && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${job.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                       }`}>
                                       {job.status}
                                    </span>
                                 )}
                              </div>

                              {/* Progress */}
                              {(job.status === 'running' || job.status === 'queued') && (
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-xs mb-1">
                                       <span className="text-blue-400 font-medium">{job.message || 'Processing...'}</span>
                                       <span className="text-gray-300 font-mono bold">{Math.round(job.progress)}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                                       <div
                                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                          style={{ width: `${job.progress}%` }}
                                       />
                                    </div>
                                 </div>
                              )}

                              {job.status === 'failed' && job.message && (
                                 <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                                    <span className="text-xs text-red-300 line-clamp-2">{job.message}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500">
               <div className="flex gap-4">
                  <span>{activeJobs.length} active tasks</span>
                  <span>{historyJobs.length} completed/failed</span>
               </div>
               <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>Downloads are saved to your selected output folder</span>
               </div>
            </div>
         </div>
      </div>
   );
}
