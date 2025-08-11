import path from 'path';
import documentQueue from '../../domain/services/document/queue/documentQueue.js';
import documentRepository from '../../infraestructure/repositories/documentRepository.js';

class DocumentController {
  async verifyMultipleDocument(req, res, next) {
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

      const jobStatus = documentQueue.getJob(jobId);

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
          processedFiles: jobStatus.processedFiles || jobStatus.results.length,
          totalFiles: jobStatus.files.length,
          progress:
            jobStatus.progress ||
            Math.round(
              (jobStatus.results.length / jobStatus.files.length) * 100
            ),
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

  async getDocumentHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const userId = req.user?.id;

      let documents;
      if (userId) {
        documents = await documentRepository.getDocumentByUserId(
          userId,
          limit,
          offset
        );
      } else {
        documents = await documentRepository.getAllDocuments(limit, offset);
      }

      const totalPages = Math.ceil(documents.count / limit);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          documents: documents.rows,
          pagination: {
            total: documents.count,
            page,
            limit,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentsByJobId(req, res, next) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'ID de Job es requerido',
        });
      }

      const documents = await documentRepository.getDocumentsByJobId(jobId);

      if (!documents || documents.length === 0) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'No se encontraron documentos para ese Job',
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          jobId,
          count: documents.length,
          documents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllDocuments(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const documents = await documentRepository.getAllDocuments(limit, offset);

      const totalPages = Math.ceil(documents.count / limit);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          documents: documents.rows,
          pagination: {
            total: documents.count,
            page,
            limit,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();
