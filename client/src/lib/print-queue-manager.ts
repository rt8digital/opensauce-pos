/**
 * Advanced Print Queue Management System
 * Priority-based queuing, persistence, and intelligent job handling
 */

export interface PrintJob {
  id: string;
  printerId: string;
  data: Uint8Array;
  priority: 'high' | 'normal' | 'low';
  contentType: 'receipt' | 'label' | 'report' | 'test';
  userId?: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  estimatedCompletion?: number;
  actualCompletion?: number;
  dataSize: number;
}

export interface QueueStats {
  totalJobs: number;
  queuedJobs: number;
  printingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageWaitTime: number;
  averagePrintTime: number;
  queueEfficiency: number; // Percentage
}

export class PrintQueueManager {
  private static instances = new Map<string, PrintQueueManager>();
  private queues = new Map<string, PrintJob[]>();
  private jobHistory: PrintJob[] = [];
  private processingInterval?: NodeJS.Timeout;
  private maxQueueSize: number;
  private maxRetries: number;

  constructor(
    private printerId: string,
    options: { maxQueueSize?: number; maxRetries?: number } = {}
  ) {
    this.maxQueueSize = options.maxQueueSize || 100;
    this.maxRetries = options.maxRetries || 3;
    
    if (!this.queues.has(printerId)) {
      this.queues.set(printerId, []);
    }
  }

  static getInstance(printerId: string): PrintQueueManager {
    if (!this.instances.has(printerId)) {
      this.instances.set(printerId, new PrintQueueManager(printerId));
    }
    return this.instances.get(printerId)!;
  }

  static getAllInstances(): PrintQueueManager[] {
    return Array.from(this.instances.values());
  }

  /**
   * Add job to queue
   */
  addJob(jobData: Omit<PrintJob, 'id' | 'timestamp' | 'retries' | 'status' | 'dataSize'> & { data: Uint8Array }): string {
    const jobId = this.generateJobId();
    
    const job: PrintJob = {
      id: jobId,
      ...jobData,
      timestamp: Date.now(),
      retries: 0,
      status: 'queued',
      dataSize: jobData.data.length
    };

    const queue = this.queues.get(this.printerId) || [];
    
    // Check queue size limit
    if (queue.length >= this.maxQueueSize) {
      throw new Error(`Queue for printer ${this.printerId} is full (max ${this.maxQueueSize} jobs)`);
    }

    // Insert job based on priority (high priority goes to front)
    const insertIndex = this.findPriorityInsertPosition(queue, job.priority);
    queue.splice(insertIndex, 0, job);
    
    this.queues.set(this.printerId, queue);
    
    console.log(`Added job ${jobId} to queue for printer ${this.printerId} (priority: ${job.priority})`);
    
    // Start processing if not already running
    if (!this.processingInterval) {
      this.startProcessing();
    }
    
    return jobId;
  }

  /**
   * Cancel job by ID
   */
  cancelJob(jobId: string): boolean {
    const queue = this.queues.get(this.printerId) || [];
    const index = queue.findIndex(job => job.id === jobId);
    
    if (index !== -1) {
      const job = queue[index];
      job.status = 'cancelled';
      job.actualCompletion = Date.now();
      
      // Move to history
      this.jobHistory.push(job);
      queue.splice(index, 1);
      
      this.queues.set(this.printerId, queue);
      console.log(`Cancelled job ${jobId} for printer ${this.printerId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    const queue = this.queues.get(this.printerId) || [];
    const completedJobs = this.jobHistory.filter(job => job.status === 'completed');
    const failedJobs = this.jobHistory.filter(job => job.status === 'failed');
    
    const totalWaitTime = completedJobs.reduce((sum, job) => {
      return sum + ((job.actualCompletion || job.timestamp) - job.timestamp);
    }, 0);
    
    const totalPrintTime = completedJobs.reduce((sum, job) => {
      return sum + ((job.actualCompletion || 0) - job.timestamp);
    }, 0);
    
    return {
      totalJobs: queue.length + this.jobHistory.length,
      queuedJobs: queue.filter(job => job.status === 'queued').length,
      printingJobs: queue.filter(job => job.status === 'printing').length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageWaitTime: completedJobs.length > 0 ? Math.round(totalWaitTime / completedJobs.length) : 0,
      averagePrintTime: completedJobs.length > 0 ? Math.round(totalPrintTime / completedJobs.length) : 0,
      queueEfficiency: queue.length + this.jobHistory.length > 0 
        ? Math.round((completedJobs.length / (queue.length + this.jobHistory.length)) * 100)
        : 100
    };
  }

  /**
   * Get current queue
   */
  getQueue(): PrintJob[] {
    return [...(this.queues.get(this.printerId) || [])];
  }

  /**
   * Get job history
   */
  getJobHistory(limit?: number): PrintJob[] {
    const history = [...this.jobHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Clear completed jobs from history
   */
  clearHistory(olderThanMs?: number): number {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : 0;
    const initialLength = this.jobHistory.length;
    
    this.jobHistory = this.jobHistory.filter(job => 
      job.status === 'queued' || job.status === 'printing' || (job.actualCompletion || 0) > cutoff
    );
    
    return initialLength - this.jobHistory.length;
  }

  /**
   * Start automatic queue processing
   */
  startProcessing(intervalMs: number = 1000): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process queue manually
   */
  async processQueue(): Promise<void> {
    const queue = this.queues.get(this.printerId) || [];
    const queuedJobs = queue.filter(job => job.status === 'queued');
    
    if (queuedJobs.length === 0) {
      return;
    }

    // Process highest priority job first
    const job = queuedJobs[0];
    
    try {
      job.status = 'printing';
      job.estimatedCompletion = Date.now() + this.estimatePrintTime(job);
      
      console.log(`Processing job ${job.id} for printer ${this.printerId}...`);
      
      // In a real implementation, this would send to actual printer
      await this.simulatePrintJob(job);
      
      job.status = 'completed';
      job.actualCompletion = Date.now();
      
      // Move to history
      this.jobHistory.push(job);
      const queueIndex = queue.findIndex(j => j.id === job.id);
      if (queueIndex !== -1) {
        queue.splice(queueIndex, 1);
      }
      
      console.log(`✓ Completed job ${job.id} for printer ${this.printerId}`);
      
    } catch (error) {
      console.error(`✗ Failed job ${job.id} for printer ${this.printerId}:`, error);
      
      job.retries++;
      job.errorMessage = (error as Error).message;
      
      if (job.retries >= job.maxRetries) {
        job.status = 'failed';
        job.actualCompletion = Date.now();
        this.jobHistory.push(job);
        const queueIndex = queue.findIndex(j => j.id === job.id);
        if (queueIndex !== -1) {
          queue.splice(queueIndex, 1);
        }
      } else {
        job.status = 'queued'; // Retry later
        console.log(`Job ${job.id} will retry (${job.retries}/${job.maxRetries})`);
      }
    }
    
    this.queues.set(this.printerId, queue);
  }

  /**
   * Find position to insert job based on priority
   */
  private findPriorityInsertPosition(queue: PrintJob[], priority: PrintJob['priority']): number {
    const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
    const targetPriority = priorityOrder[priority];
    
    for (let i = 0; i < queue.length; i++) {
      const existingPriority = priorityOrder[queue[i].priority];
      if (targetPriority < existingPriority) {
        return i;
      }
    }
    
    return queue.length;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `JOB_${this.printerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate print time for job
   */
  private estimatePrintTime(job: PrintJob): number {
    const baseTime = 2000; // Base time in ms
    const sizeFactor = job.dataSize / 1000; // Bytes to KB factor
    const priorityFactor: Record<string, number> = { high: 0.8, normal: 1, low: 1.2 };
    
    return Math.round(baseTime * sizeFactor * priorityFactor[job.priority]);
  }

  /**
   * Simulate print job execution
   */
  private async simulatePrintJob(job: PrintJob): Promise<void> {
    // Simulate actual printing time
    const printTime = this.estimatePrintTime(job);
    await new Promise(resolve => setTimeout(resolve, printTime));
    
    // Simulate occasional print failures (3% failure rate)
    if (Math.random() < 0.03) {
      throw new Error('Print head jam');
    }
  }
}

// Global queue manager for coordinating multiple printers
export class GlobalQueueManager {
  private static instance: GlobalQueueManager;
  private managers = new Map<string, PrintQueueManager>();

  private constructor() {}

  static getInstance(): GlobalQueueManager {
    if (!this.instance) {
      this.instance = new GlobalQueueManager();
    }
    return this.instance;
  }

  /**
   * Get or create queue manager for printer
   */
  getQueueManager(printerId: string): PrintQueueManager {
    if (!this.managers.has(printerId)) {
      this.managers.set(printerId, PrintQueueManager.getInstance(printerId));
    }
    return this.managers.get(printerId)!;
  }

  /**
   * Submit job to appropriate queue
   */
  submitJob(printerId: string, jobData: Omit<PrintJob, 'id' | 'timestamp' | 'retries' | 'status' | 'dataSize' | 'printerId'> & { data: Uint8Array }): string {
    const manager = this.getQueueManager(printerId);
    return manager.addJob({ ...jobData, printerId });
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): {
    totalPrinters: number;
    totalJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    overallEfficiency: number;
  } {
    const managers = Array.from(this.managers.values());
    const stats = managers.map(m => m.getQueueStats());
    
    const totals = stats.reduce((acc, stat) => ({
      totalJobs: acc.totalJobs + stat.totalJobs,
      queuedJobs: acc.queuedJobs + stat.queuedJobs,
      completedJobs: acc.completedJobs + stat.completedJobs,
      failedJobs: acc.failedJobs + stat.failedJobs,
      efficiencySum: acc.efficiencySum + stat.queueEfficiency
    }), { totalJobs: 0, queuedJobs: 0, completedJobs: 0, failedJobs: 0, efficiencySum: 0 });

    return {
      totalPrinters: managers.length,
      totalJobs: totals.totalJobs,
      queuedJobs: totals.queuedJobs,
      completedJobs: totals.completedJobs,
      failedJobs: totals.failedJobs,
      overallEfficiency: managers.length > 0 ? Math.round(totals.efficiencySum / managers.length) : 100
    };
  }

  /**
   * Start all queue processing
   */
  startAllProcessing(): void {
    this.managers.forEach(manager => manager.startProcessing());
  }

  /**
   * Stop all queue processing
   */
  stopAllProcessing(): void {
    this.managers.forEach(manager => manager.stopProcessing());
  }
}