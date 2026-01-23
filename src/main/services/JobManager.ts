import { BrowserWindow } from 'electron';
import { Job, JobProgress, ConversionRequest, DownloadRequest } from '../../shared/types/media';
import { v4 as uuidv4 } from 'uuid';
import { SettingsService } from './SettingsService';

export class JobManager {
  private jobs: Map<string, Job> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private services: Record<string, any> = {};
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

  registerService(type: 'conversion' | 'download', service: any) {
    this.services[type] = service;
  }

  async startConversion(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
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
    if (this.services['conversion']) {
      // Async execution
      this.services['conversion'].start(jobId, request, (progress: Partial<JobProgress>) => {
        this.updateJob(jobId, progress);
      }).catch((err: Error) => {
        this.updateJob(jobId, { status: 'failed', message: err.message, error: err.message });
      });
    }

    return jobId;
  }

  async startDownload(request: DownloadRequest): Promise<string> {
    const jobId = uuidv4();
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

    if (this.services['download']) {
      this.services['download'].start(jobId, request, (progress: Partial<JobProgress>) => {
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
      if (this.services[job.type]) {
        this.services[job.type].cancel(jobId);
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
