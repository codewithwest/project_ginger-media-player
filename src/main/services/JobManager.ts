import { BrowserWindow } from 'electron';
import { Job, JobProgress, ConversionRequest, DownloadRequest } from '../../shared/types/media';
import { randomUUID } from 'crypto';
import { SettingsService } from './SettingsService';

// Service interface for job execution
interface JobService {
  start(jobId: string, request: ConversionRequest | DownloadRequest, onProgress: (progress: Partial<JobProgress>) => void): Promise<void>;
  cancel(jobId: string): void;
}

export class JobManager {
  private jobs: Map<string, Job> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private services: Partial<Record<'conversion' | 'download', JobService>> = {};
  private settingsService: SettingsService;

  constructor(mainWindow: BrowserWindow, settingsService: SettingsService) {
    this.mainWindow = mainWindow;
    this.settingsService = settingsService;

    // Load history into active jobs
    const history = this.settingsService.getJobHistory();
    history.forEach(job => {
      this.jobs.set(job.jobId, job);
    });
  }

  registerService(type: 'conversion' | 'download', service: JobService): void {
    this.services[type] = service;
  }

  async startConversion(request: ConversionRequest): Promise<string> {
    const jobId = randomUUID();
    const job: Job = {
      jobId,
      type: 'conversion',
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      details: request,
      message: 'Initializing...'
    };

    this.jobs.set(jobId, job);
    this.emitProgress(job);

    // Provide a callback or event listener for the service to update progress
    // In a real app, this might be decoupled via events, but direct call is simple for now
    const conversionService = this.services['conversion'];
    if (conversionService) {
      // Async execution
      conversionService.start(jobId, request, (progress: Partial<JobProgress>) => {
        this.updateJob(jobId, progress);
      }).catch((err: Error) => {
        this.updateJob(jobId, { status: 'failed', message: err.message, error: err.message });
      });
    }

    return jobId;
  }

  async startDownload(request: DownloadRequest): Promise<string> {
    const jobId = randomUUID();
    const job: Job = {
      jobId,
      type: 'download',
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      details: request,
      message: 'Initializing...'
    };

    this.jobs.set(jobId, job);
    console.log(`[JobManager] Starting download job: ${jobId}`, request.url);
    this.emitProgress(job);

    const downloadService = this.services['download'];
    if (downloadService) {
      downloadService.start(jobId, request, (progress: Partial<JobProgress>) => {
        this.updateJob(jobId, progress);
      }).catch((err: Error) => {
        this.updateJob(jobId, { status: 'failed', message: err.message, error: err.message });
      });
    }

    return jobId;
  }

  cancelJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job && (job.status === 'running' || job.status === 'queued')) {
      // Notify service to cancel
      const service = this.services[job.type];
      if (service) {
        service.cancel(jobId);
      }
      this.updateJob(jobId, { status: 'cancelled', message: 'Cancelled by user' });
    }
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  private updateJob(jobId: string, updates: Partial<Job>) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);
    this.jobs.set(jobId, job);
    this.settingsService.saveJob(job);
    this.emitProgress(job);
  }

  private emitProgress(job: Job) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('job:progress', job);
    }
  }
}
