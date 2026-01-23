import { useEffect } from 'react';
import { useJobsStore } from '../../state/jobs';
import { X, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Job } from '../../../shared/types/media';

export function JobsView() {
  const { jobs, syncJobs, updateJob } = useJobsStore();

  useEffect(() => {
    syncJobs();

    const cleanup = window.electronAPI.jobs.onProgress((data) => {
      // The event data from main process is the full Job object currently, 
      // but the type says JobProgress. Let's make sure we handle it.
      // Our JobManager emits the full Job object.
      // But shared type for IPC event data is just JobProgress? 
      // Actually main emits 'job:progress' with `job`. 
      // Let's assume it maps correctly.
      updateJob(data); 
    });

    return cleanup;
  }, []);

  const getIcon = (status: Job['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'queued': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'cancelled': return <X className="w-5 h-5 text-gray-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleCancel = (jobId: string) => {
    window.electronAPI.jobs.cancel(jobId);
  };

  if (jobs.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-center">
        No active jobs
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 w-full max-w-sm bg-gray-900 h-full overflow-y-auto border-l border-gray-800">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2 px-2">Background Jobs</h2>
      {jobs.map((job) => (
        <div key={job.jobId} className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon(job.status)}
              <span className="text-sm font-medium text-white max-w-[150px] truncate">
                {job.type === 'conversion' ? 'Converting file' : 'Downloading'}
              </span>
            </div>
            {(job.status === 'running' || job.status === 'queued') && (
              <button 
                onClick={() => handleCancel(job.jobId)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-400 truncate">
             {job.message || job.status}
          </div>

          {(job.status === 'running' || job.status === 'queued') && (
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
