import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import documentQueue from '../../../src/domain/services/document/queue/documentQueue.js';
import * as docRepoModule from '../../../src/infraestructure/repositories/documentRepository.js';

class MockDocService {
  async analyzeDocument(file) {
    if (file.fail) throw new Error('analisis fallido');
    return {
      status: 'valid',
      confidence: 80,
      details: { score: 55 },
      extractedData: { patente: 'ZZ1234', camposCompletados: 2 },
      issues: [],
      summary: 'OK',
    };
  }
}

const waitForJob = async (id, timeoutMs = 2000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = documentQueue.getJob(id);
    if (job && (job.status === 'completed' || job.status === 'failed')) {
      return job;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('Timeout esperando finalización de job');
};

describe('documentQueue', () => {
  beforeEach(() => {
    documentQueue.queue = [];
    documentQueue.processing = false;
    documentQueue.results = new Map();
    documentQueue.DocumentServiceOverride = MockDocService;
    jest
      .spyOn(docRepoModule.default, 'saveDocument')
      .mockResolvedValue({ id: 1 });
  });

  const makeFile = (name, extra = {}) => ({
    originalname: name,
    filename: name,
    size: 100,
    mimetype: 'application/pdf',
    path: `/tmp/${name}`,
    ...extra,
  });

  it('addJob guarda y retorna jobId', () => {
    const jobId = documentQueue.addJob([makeFile('a.pdf')], 'user1');
    expect(jobId).toMatch(/job_/);
    const job = documentQueue.getJob(jobId);
    expect(job.files).toHaveLength(1);
    expect(job.userId).toBe('user1');
  });

  it('procesa exitosamente archivos válidos', async () => {
    const jobId = documentQueue.addJob([makeFile('a.pdf'), makeFile('b.pdf')]);
    const job = await waitForJob(jobId);
    expect(job.status).toBe('completed');
    expect(job.results).toHaveLength(2);
    expect(job.progress).toBe(100);
  });

  it('maneja errores individuales en archivos', async () => {
    const jobId = documentQueue.addJob([
      makeFile('ok.pdf'),
      makeFile('fail.pdf', { fail: true }),
    ]);
    const job = await waitForJob(jobId);
    const errorEntry = job.results.find((r) => r.error);
    expect(errorEntry.error).toContain('analisis fallido');
    expect(job.status).toBe('completed');
  });

  it('getJobStatus refleja longitud de cola', () => {
    documentQueue.addJob([makeFile('x.pdf')]);
    const status = documentQueue.getJobStatus();
    expect(status.totalJobs).toBe(1);
  });
});
