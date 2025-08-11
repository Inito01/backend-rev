import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import documentController from '../../../src/controllers/document/documentController.js';
import documentQueue from '../../../src/domain/services/document/queue/documentQueue.js';
import documentRepository from '../../../src/infraestructure/repositories/documentRepository.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('DocumentController', () => {
  let req, res, next;
  beforeEach(() => {
    req = { files: [], params: {}, query: {}, user: { id: 'user1' } };
    res = makeRes();
    next = jest.fn();
    jest.restoreAllMocks();
  });

  describe('verifyMultipleDocument', () => {
    it('retorna 400 sin archivos', async () => {
      await documentController.verifyMultipleDocument(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si extensión inválida', async () => {
      req.files = [{ originalname: 'mal.exe' }];
      await documentController.verifyMultipleDocument(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('agrega job para archivos válidos', async () => {
      req.files = [
        { originalname: 'ok.pdf', size: 10, mimetype: 'application/pdf' },
        { originalname: 'foto.jpg', size: 8, mimetype: 'image/jpeg' },
      ];
      jest.spyOn(documentQueue, 'addJob').mockReturnValue('job123');
      await documentController.verifyMultipleDocument(req, res, next);
      expect(documentQueue.addJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getJobStatus', () => {
    it('retorna 400 sin jobId', async () => {
      await documentController.getJobStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si job no existe', async () => {
      req.params.jobId = 'nope';
      jest.spyOn(documentQueue, 'getJob').mockReturnValue(undefined);
      await documentController.getJobStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna info de job existente', async () => {
      req.params.jobId = 'ok';
      jest.spyOn(documentQueue, 'getJob').mockReturnValue({
        id: 'ok',
        status: 'completed',
        files: [{}, {}],
        results: [{}, {}],
        createdAt: new Date(),
      });
      await documentController.getJobStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDocumentHistory', () => {
    it('usa getDocumentByUserId si hay usuario', async () => {
      jest
        .spyOn(documentRepository, 'getDocumentByUserId')
        .mockResolvedValue({ count: 1, rows: [] });
      await documentController.getDocumentHistory(req, res, next);
      expect(documentRepository.getDocumentByUserId).toHaveBeenCalled();
    });

    it('usa getAllDocuments si no hay userId', async () => {
      req.user = null;
      jest
        .spyOn(documentRepository, 'getAllDocuments')
        .mockResolvedValue({ count: 0, rows: [] });
      await documentController.getDocumentHistory(req, res, next);
      expect(documentRepository.getAllDocuments).toHaveBeenCalled();
    });
  });

  describe('getDocumentsByJobId', () => {
    it('retorna 400 sin jobId', async () => {
      await documentController.getDocumentsByJobId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 sin documentos', async () => {
      req.params.jobId = 'job1';
      jest
        .spyOn(documentRepository, 'getDocumentsByJobId')
        .mockResolvedValue([]);
      await documentController.getDocumentsByJobId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 200 con documentos', async () => {
      req.params.jobId = 'job1';
      jest
        .spyOn(documentRepository, 'getDocumentsByJobId')
        .mockResolvedValue([{ id: 1 }]);
      await documentController.getDocumentsByJobId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAllDocuments', () => {
    it('retorna documentos paginados', async () => {
      jest
        .spyOn(documentRepository, 'getAllDocuments')
        .mockResolvedValue({ count: 2, rows: [{ id: 1 }, { id: 2 }] });
      await documentController.getAllDocuments(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
