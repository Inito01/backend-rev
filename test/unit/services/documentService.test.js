import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import DocumentService from '../../../src/domain/services/document/documentService.js';

class FakeAnalyzer {
  async analyzeDocument(file) {
    return {
      type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'PDF',
      status: 'valid',
      confidence: 90,
      details: { score: 60 },
      extractedData: { patente: 'ABC123', camposCompletados: 3 },
      issues: [],
      summary: 'OK',
    };
  }
}

describe('DocumentService', () => {
  let service;
  beforeEach(() => {
    service = new DocumentService();
    service.analyzer = new FakeAnalyzer();
  });

  const baseFile = {
    originalname: 'doc.pdf',
    size: 1234,
    mimetype: 'application/pdf',
    path: '/tmp/doc.pdf',
  };

  it('devuelve resultado válido para PDF', async () => {
    const result = await service.analyzeDocument(baseFile);
    expect(result.status).toBe('valid');
    expect(result.details.fileName).toBe('doc.pdf');
    expect(result.type || 'PDF').toBeDefined();
  });

  it('enriquece detalles para imagen', async () => {
    const img = {
      ...baseFile,
      mimetype: 'image/jpeg',
      originalname: 'foto.jpg',
    };
    const result = await service.analyzeDocument(img);
    expect(result.details.fileType).toBe('image/jpeg');
  });

  it('retorna objeto invalid para tipo desconocido', async () => {
    const unknown = {
      ...baseFile,
      mimetype: 'text/plain',
      originalname: 'x.txt',
    };
    const result = await service.analyzeDocument(unknown);
    expect(result.status).toBe('invalid');
    expect(result.issues).toContain(
      'Tipo de archivo no soportado para análisis'
    );
  });

  it('propaga error envuelto si analyzer lanza', async () => {
    service.analyzer.analyzeDocument = jest
      .fn()
      .mockRejectedValue(new Error('fallo interno'));
    await expect(service.analyzeDocument(baseFile)).rejects.toThrow(
      'Error al analizar el documento: fallo interno'
    );
  });
});
