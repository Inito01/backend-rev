import multer from 'multer';

const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message:
            'El archivo es demasiado grande. El tamaño máximo permitido es 10MB',
          errorCode: 'FILE_TOO_LARGE',
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message:
            'Campo de archivo inesperado. Usa el campo "document" o "documents"',
          errorCode: 'UNEXPECTED_FILE',
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Demasiados archivos. Solo se permite 5 archivo a la vez',
          errorCode: 'TOO_MANY_FILES',
        });

      default:
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Error en la subida del archivo',
          erroCode: 'UPLOAD_ERROR',
        });
    }
  }

  if (error.message && error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
      errorCode: 'INVALID_FILE_TYPE',
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Error de validación',
      errors: error.details || error.message,
      errorCode: 'VALIDATION_ERROR',
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Error interno del servidor',
    errorCode: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
};

export default errorHandler;
