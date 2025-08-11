import { jest } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRATION = '1h';
jest.setTimeout(10000);

// Silenciar logs para output limpio
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global de SimpleAnalyzer para evitar hilos/IO de sharp, pdf-parse, ocr
jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    genSalt: async () => 'salt',
    hash: async (pwd) => `hashed:${pwd}`,
    compare: async () => true,
  },
  genSalt: async () => 'salt',
  hash: async (pwd) => `hashed:${pwd}`,
  compare: async () => true,
}));

jest.mock('../src/domain/services/analyzers/documentAnalizer.js', () => {
  return {
    __esModule: true,
    default: class MockAnalyzer {
      analyzeDocument() {
        return Promise.resolve({
          status: 'valid',
          confidence: 80,
          issues: [],
          extractedData: { patente: 'MOCK', camposCompletados: 1 },
          details: {},
          summary: 'mocked',
        });
      }
      analyzePDF(file) {
        return this.analyzeDocument(file);
      }
      analyzeImage(file) {
        return this.analyzeDocument(file);
      }
      performContentAnalysis() {
        return { score: 60, ocrConfidence: 80 };
      }
      extractVehicleData() {
        return { patente: 'MOCK', camposCompletados: 1 };
      }
      determinateStatus() {
        return 'valid';
      }
      collectIssues() {
        return [];
      }
    },
  };
});

// Mock libs potenciales con handles (sharp, pdf-parse)
jest.mock('sharp', () => ({
  __esModule: true,
  default: () => ({
    resize: () => ({
      greyscale: () => ({
        normalise: () => ({
          sharpen: () => ({ toBuffer: async () => Buffer.from('') }),
        }),
      }),
    }),
    metadata: async () => ({ format: 'jpeg', width: 800, height: 800 }),
  }),
}));
jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: async () => ({ text: 'PDF TEXT MOCK' }),
}));

// Limpieza de recursos (sequelize y event emitters) al finalizar
afterAll(async () => {
  try {
    const { sequelize } = await import('../src/config/database.js');
    if (sequelize?.close) await sequelize.close();
  } catch (_) {}
  try {
    const { default: documentQueue } = await import(
      '../src/domain/services/document/queue/documentQueue.js'
    );
    documentQueue.removeAllListeners();
  } catch (_) {}
  // limpiar timers activos
  jest.useRealTimers();
});

// Fallback: forzar salida si aún quedan handles (último recurso)
if (process.env.FORCE_JEST_EXIT === 'true') {
  afterAll(() => setTimeout(() => process.exit(0), 50));
}
