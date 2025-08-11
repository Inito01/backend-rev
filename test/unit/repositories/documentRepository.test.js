import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import documentRepository from '../../../src/infraestructure/repositories/documentRepository.js';
import Document from '../../../src/infraestructure/database/models/Document.js';

const sampleDoc = { id: 1, jobId: 'job1', userId: 'u1' };

describe('documentRepository', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('saveDocument crea documento', async () => {
    jest.spyOn(Document, 'create').mockResolvedValue(sampleDoc);
    const res = await documentRepository.saveDocument(sampleDoc);
    expect(Document.create).toHaveBeenCalledWith(sampleDoc);
    expect(res).toBe(sampleDoc);
  });

  it('getDocumentsByJobId retorna lista', async () => {
    jest.spyOn(Document, 'findAll').mockResolvedValue([sampleDoc]);
    const res = await documentRepository.getDocumentsByJobId('job1');
    expect(Document.findAll).toHaveBeenCalled();
    expect(res).toHaveLength(1);
  });

  it('getDocumentByUserId retorna paginado', async () => {
    const paginated = { count: 1, rows: [sampleDoc] };
    jest.spyOn(Document, 'findAndCountAll').mockResolvedValue(paginated);
    const res = await documentRepository.getDocumentByUserId('u1', 10, 0);
    expect(Document.findAndCountAll).toHaveBeenCalled();
    expect(res).toBe(paginated);
  });

  it('getAllDocuments retorna paginado', async () => {
    const paginated = { count: 0, rows: [] };
    jest.spyOn(Document, 'findAndCountAll').mockResolvedValue(paginated);
    const res = await documentRepository.getAllDocuments(5, 0);
    expect(res.rows).toEqual([]);
  });
});
