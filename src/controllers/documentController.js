import path from 'path';
import DocumentService from '../domain/services/documentService.js';

class DocumentController {
  async verifyDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'No se proporcionó ningún archivo',
        });
      }

      const file = req.file;

      const allowedExtensions = ['.pdf', '.jpg', '.jpeg'];
      const fileExtension = path.extname(file.originalname).toLocaleLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message:
            'Extensión de archivo no permitida. Solo se permiten archivos PDF, JPG y JPEG',
        });
      }

      const documentService = new DocumentService();
      const result = await documentService.analyzeDocument(file);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Documento procesado correctamente',
        result: result.status,
        confidence: result.confidence,
        details: result.details,
        extractedData: result.extractedData,
      });
    } catch (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message:
            'El archivo es demasiado grande. El tamaño máximo permitido es 10MB',
        });
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Campo de archivo inesperado',
        });
      }

      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new DocumentController();
