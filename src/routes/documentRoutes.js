import express from 'express';
import upload from '../infraestructure/upload/multerConfig.js';
import documentController from '../controllers/documentController.js';

const router = express.Router();

router.post(
  '/verify',
  upload.single('document'),
  documentController.verifyDocument
);

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
  });
});

export default router;
