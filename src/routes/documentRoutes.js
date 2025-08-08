import express from 'express';
import upload from '../infraestructure/upload/multerConfig.js';
import documentController from '../controllers/documentController.js';
import errorHandlers from '../middlewares/errorHandlers.js';

const router = express.Router();

router.post(
  '/verify',
  upload.single('document'),
  documentController.verifyDocument
);

router.post(
  '/verify-multiple',
  upload.array('documents', 5),
  documentController.verifyMultipleDocument
);

router.get('/job/:jobId', documentController.getJobStatus);

router.get('/queue/status', documentController.getQueueStatus);

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
      singleFile: '/api/documents/verify',
      multipleFiles: '/api/documents/verify-multiple',
      jobStatus: '/api/documents/job/:jobId',
      queueStatus: '/api/documents/queue/status',
    },
  });
});

router.use(errorHandlers);

export default router;
