import { create } from 'zustand';
import { Job, JobProgress } from '../../shared/types/media';

interface JobsState {
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (progress: JobProgress) => void;
  setJobs: (jobs: Job[]) => void;
  syncJobs: () => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  
  updateJob: (progress) => set((state) => ({
    jobs: state.jobs.map((job) => 
      job.jobId === progress.jobId 
        ? { ...job, ...progress }
        : job
    )
  })),

  setJobs: (jobs) => set({ jobs }),

  syncJobs: async () => {
    try {
      // Fetch initial list
      const jobs = await window.electronAPI.jobs.getAll();
      set({ jobs });
    } catch (error) {
      console.error('Failed to sync jobs:', error);
    }
  }
}));

// Initialize listeners
// This needs to be called once, maybe in App.tsx or here if we can side-effect safely
// Best to do it in a hook or App.tsx useEffect
