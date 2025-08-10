import EventEmitter from 'events';
import documentRepository from '../../infraestructure/repositories/documentRepository.js';

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
      this.results.set(job.id, job);

      const DocumentService = (await import('./documentService.js')).default;
      const documentService = new DocumentService();

      // Procesar
      const totalFiles = job.files.length;
      let processedFiles = 0;

      job.processedFiles = processedFiles;
      job.progress = 0;
      this.results.set(job.id, job);
      this.emit('jobProgress', job);

      for (const file of job.files) {
        // await delay(2000);  Esto lo use para validar que mi componente de progreso funcionara, al ir muy rapido pues ni se apreciaba.
        try {
          const result = await documentService.analyzeDocument(file);

          await documentRepository.saveDocument({
            jobId: job.id,
            userId: job.userId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: file.path,
            status: result.status,
            confidence: result.confidence,
            analysisDetails: result.details,
            extractedData: result.extractedData,
            issues: result.issues,
            summary: result.summary,
          });

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

        processedFiles++;
        job.processedFiles = processedFiles;
        job.progress = Math.round((processedFiles / totalFiles) * 100);
        this.results.set(job.id, job);
        this.emit('jobProgress', job);
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

  getJob(jobId) {
    return this.results.get(jobId);
  }
}

// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

const documentQueue = new DocumentQueue();

export default documentQueue;
