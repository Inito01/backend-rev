import path from 'path';
import DocumentService from '../domain/services/documentService.js';
import documentQueue from '../domain/services/documentQueue.js';

class DocumentController {
  async verifyMultipleDocument(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'No se proporcionó ningún archivo',
        });
      }

      const files = req.files;
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg'];

      for (const file of files) {
        const fileExtension = path
          .extname(file.originalname)
          .toLocaleLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: `Extensión de archivo no permitida en ${file.originalname}. Solo se permiten archivos PDF, JPG y JPEG`,
          });
        }
      }

      // agregar trabajo a la cola
      const jobId = documentQueue.addJob(files, req.user?.id);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `${files.length} archivo(s) agregado(s) a la cola de procesamiento`,
        jobId: jobId,
        fileCount: files.length,
        files: files.map((f) => ({
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'No se proporcionó nigun archivo',
        });
      }

      const file = req.file;
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg'];
      const fileExtension = path.extname(file.originalname).toLowerCase();

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
      next(error);
    }
  }

  async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'ID de trabajo requerido',
        });
      }

      const jobStatus = documentQueue.getJobStatus(jobId);

      if (!jobStatus) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Trabajo no encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        job: {
          id: jobStatus.id,
          status: jobStatus.status,
          filesCount: jobStatus.files.length,
          results: jobStatus.results,
          createdAt: jobStatus.createdAt,
          startedAt: jobStatus.startedAt,
          completedAt: jobStatus.completedAt,
          error: jobStatus.error,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getQueueStatus(req, res, next) {
    try {
      const queueStatus = documentQueue.getQueueStatus();

      return res.status(200).json({
        success: true,
        statusCode: 200,
        queue: queueStatus,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();
