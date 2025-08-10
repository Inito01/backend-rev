import express from 'express';
import upload from '../infraestructure/upload/multerConfig.js';
import documentController from '../controllers/documentController.js';
import errorHandlers from '../middlewares/errorHandlers.js';

const router = express.Router();

router.post(
  '/verify-multiple',
  upload.array('documents', 5),
  documentController.verifyMultipleDocument
);

router.get('/job/:jobId', documentController.getJobStatus);
router.get('/job/:jobId/documents', documentController.getDocumentsByJobId);

router.get('/history', documentController.getDocumentHistory);

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
