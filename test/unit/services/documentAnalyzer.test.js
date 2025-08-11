import { describe, it, expect, jest } from '@jest/globals';
import SimpleAnalyzer from '../../../src/domain/services/analyzers/documentAnalizer.js';

const baseText = `Vehiculo: ABC123\nFRENOS: APROBADO\nLUCES: OBSERVADO\nMOTOR: APROBADO\nEMISIONES: RECHAZADO\n`;

describe('documentAnalizer helpers', () => {
  const instance = new SimpleAnalyzer('dummy');

  it('performContentAnalysis calcula score y flags', () => {
    const result = instance.performContentAnalysis(baseText);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result).toHaveProperty('foundTerms');
  });

  it('determinateStatus determina status invalid con confianza baja', () => {
    const status = instance.determinateStatus(30);
    expect(status).toBe('invalid');
  });

  it('determinateStatus determina probably_valid en rango 70-84', () => {
    const status = instance.determinateStatus(75);
    expect(status).toBe('probably_valid');
  });

  it('extractVehicleData extrae campos basicos', () => {
    const data = instance.extractVehicleData(baseText);
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  it('analyze retorna estructura completa', async () => {
    const perfSpy = jest
      .spyOn(SimpleAnalyzer.prototype, 'performContentAnalysis')
      .mockReturnValue({ score: 60, ocrConfidence: 80 });
    const extractSpy = jest
      .spyOn(SimpleAnalyzer.prototype, 'extractVehicleData')
      .mockReturnValue({ patente: 'AA1234', camposCompletados: 2 });
    const collectSpy = jest
      .spyOn(SimpleAnalyzer.prototype, 'collectIssues')
      .mockReturnValue([]);
    const analyzeRes = await instance.analyzePDF({
      path: 'fake.pdf',
      mimetype: 'application/pdf',
      originalname: 'f.pdf',
      size: 10,
    });
    expect(perfSpy).toHaveBeenCalled();
    expect(extractSpy).toHaveBeenCalled();
    expect(analyzeRes.status).toBeDefined();
    collectSpy.mockRestore();
  });
});
