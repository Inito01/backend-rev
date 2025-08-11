import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import errorHandler from '../../../src/middlewares/errorHandler.js';
import multer from 'multer';
import { mockExpressParams } from '../../mocks/index.js';

jest.mock('multer');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    const expressParams = mockExpressParams();
    req = expressParams.req;
    res = expressParams.res;
    next = expressParams.next;
  });

  it('debería manejar errores de multer con código LIMIT_FILE_SIZE', () => {
    const error = new multer.MulterError('LIMIT_FILE_SIZE');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message:
        'El archivo es demasiado grande. El tamaño máximo permitido es 10MB',
      errorCode: 'FILE_TOO_LARGE',
    });
  });

  it('debería manejar errores de multer con código LIMIT_UNEXPECTED_FILE', () => {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message:
        'Campo de archivo inesperado. Usa el campo "document" o "documents"',
      errorCode: 'UNEXPECTED_FILE',
    });
  });

  it('debería manejar errores de multer con código LIMIT_FILE_COUNT', () => {
    const error = new multer.MulterError('LIMIT_FILE_COUNT');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Demasiados archivos. Solo se permite 5 archivo a la vez',
      errorCode: 'TOO_MANY_FILES',
    });
  });

  it('debería manejar otros errores de multer', () => {
    const error = new multer.MulterError('UNKNOWN_CODE');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Error en la subida del archivo',
      erroCode: 'UPLOAD_ERROR',
    });
  });

  it('debería manejar errores de tipo de archivo no permitido', () => {
    const error = new Error('Tipo de archivo no permitido: .exe');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: error.message,
      errorCode: 'INVALID_FILE_TYPE',
    });
  });

  it('debería manejar errores de validación', () => {
    const error = new Error('Datos inválidos');
    error.name = 'ValidationError';
    error.details = [{ field: 'email', message: 'Email inválido' }];

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Error de validación',
      errors: error.details,
      errorCode: 'VALIDATION_ERROR',
    });
  });

  it('debería manejar errores internos del servidor en modo producción', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Error interno');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      message: 'Error interno del servidor',
      errorCode: 'INTERNAL_ERROR',
    });

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('debería incluir detalles en errores internos en modo desarrollo', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Error interno de desarrollo');
    error.stack = 'Stack trace ficticio';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      message: 'Error interno del servidor',
      errorCode: 'INTERNAL_ERROR',
      details: error.message,
      stack: error.stack,
    });

    process.env.NODE_ENV = originalNodeEnv;
  });
});
