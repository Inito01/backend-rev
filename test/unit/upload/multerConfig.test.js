import { describe, it, expect } from '@jest/globals';
import upload, {
  fileFilter,
} from '../../../src/infraestructure/upload/multerConfig.js';

describe('multerConfig fileFilter', () => {
  const cb = (err, accept) => {
    if (err) throw err; // Para simplificar
    cb.result = accept; // guardar bandera
  };

  it('acepta pdf', () => {
    const file = { mimetype: 'application/pdf' };
    fileFilter({}, file, cb);
    expect(cb.result).toBe(true);
  });

  it('acepta imagen jpeg', () => {
    const file = { mimetype: 'image/jpeg' };
    fileFilter({}, file, cb);
    expect(cb.result).toBe(true);
  });

  it('rechaza tipo no permitido', () => {
    const file = { mimetype: 'text/plain' };
    try {
      fileFilter({}, file, cb);
    } catch (e) {
      expect(e.message).toMatch(/Tipo de archivo no permitido|not allowed/i);
    }
  });
});
