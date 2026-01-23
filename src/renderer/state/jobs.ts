import { create } from 'zustand';
import { Job, JobProgress } from '../../shared/types/media';

interface JobsState {
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (progress: JobProgress) => void;
  setJobs: (jobs: Job[]) => void;
  syncJobs: () => Promise<void>;
  removeJob: (jobId: string) => void;
  clearCompleted: () => void;
  clearHistory: () => Promise<void>;
  initializeListeners: () => () => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: [],

  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),

  updateJob: (progress) => set((state) => ({
    jobs: state.jobs.map((job) =>
      job.jobId === progress.jobId
        ? { ...job, ...progress }
        : job
    )
  })),

  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter((j) => j.jobId !== jobId)
  })),

  clearCompleted: () => set((state) => ({
    jobs: state.jobs.filter((j) => j.status === 'running' || j.status === 'queued')
  })),

  clearHistory: async () => {
    try {
      await window.electronAPI.jobs.clearHistory();
      set((state) => ({
        jobs: state.jobs.filter((j) => j.status === 'running' || j.status === 'queued')
      }));
    } catch (error) {
      console.error('Failed to clear job history:', error);
    }
  },

  setJobs: (jobs) => set({ jobs }),

  syncJobs: async () => {
    try {
      const jobs = await window.electronAPI.jobs.getAll();
      set({ jobs });
    } catch (error) {
      console.error('Failed to sync jobs:', error);
    }
  },

  initializeListeners: () => {
    const cleanup = window.electronAPI.jobs.onProgress((data) => {
      set((state) => {
        const jobExists = state.jobs.some((j) => j.jobId === data.jobId);
        if (jobExists) {
          return {
            jobs: state.jobs.map((job) =>
              job.jobId === data.jobId ? { ...job, ...data } : job
            )
          };
        } else {
          // It's a new job, add it to the top
          return {
            jobs: [data as Job, ...state.jobs]
          };
        }
      });
    });
    return cleanup;
  }
}));

// Initialize listeners
// This needs to be called once, maybe in App.tsx or here if we can side-effect safely
// Best to do it in a hook or App.tsx useEffect
