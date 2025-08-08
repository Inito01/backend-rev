import EventEmitter from 'events';

class DocumentQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.results = new Map();
  }

  addJob(files, userId = 'anonId') {
    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      files: files,
      userId: userId,
      status: 'pending',
      createdAt: new Date(),
      results: [],
    };

    this.queue.push(job);
    this.results.set(jobId, job);

    this.emit('jobAdded', job);

    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.processJob(job);
    }

    this.processing = false;
  }

  async processJob(job) {
    try {
      job.status = 'processing';
      job.startedAt = new Date();

      this.emit('jobStarted', job);

      const DocumentService = (await import('./documentService.js')).default;
      const documentService = new DocumentService();

      // Procesar
      for (const file of job.files) {
        try {
          const result = await documentService.analyzeDocument(file);
          job.results.push({
            file: {
              originalname: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
            },
            analysis: result,
            processedAt: new Date(),
          });
        } catch (error) {
          job.results.push({
            file: {
              originalname: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
            },
            error: error.message,
            processedAt: new Date(),
          });
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();

      this.emit('jobCompleted', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();

      this.emit('jobFailed', job);
    }

    // Actualizar el resultado en el Map
    this.results.set(job.id, job);
  }

  getJobStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      totalJobs: this.results.size,
    };
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

const documentQueue = new DocumentQueue();

export default documentQueue;
