import express from 'express';
import upload from '../infraestructure/upload/multerConfig.js';
import documentController from '../controllers/document/documentController.js';
import errorHandlers from '../middlewares/errorHandler.js';
import { authentication, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
  '/verify-multiple',
  authentication,
  upload.array('documents', 5),
  documentController.verifyMultipleDocument
);

router.get('/job/:jobId', authentication, documentController.getJobStatus);
router.get(
  '/job/:jobId/documents',
  authentication,
  documentController.getDocumentsByJobId
);

router.get('/history', authentication, documentController.getDocumentHistory);

router.get('/all', authentication, isAdmin, documentController.getAllDocuments);

router.get('/supported-types', (req, res) => {
  res.json({
    success: true,
    supportedTypes: [
      {
        extesion: '.pdf',
        mimetype: 'application/pdf',
        description: 'Documento PDF',
      },
      {
        extesion: '.jpg',
        mimetype: 'image/jpg',
        description: 'Imagen JPG',
      },
      {
        extesion: '.jpeg',
        mimetype: 'image/jpeg',
        description: 'Imagen JPEG',
      },
    ],
    maxFileSize: '10MB',
    maxFiles: 5,
    endpoints: {
      multipleFiles: '/api/documents/verify-multiple',
      jobStatus: '/api/documents/job/:jobId',
      documentsByJobId: '/api/documents/job/:jobId/documents',
      historyOfDocuments: 'api/documents/history',
    },
  });
});

router.use(errorHandlers);

export default router;
