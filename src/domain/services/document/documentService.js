import SimpleAnalyzer from '../analyzers/documentAnalizer.js';

class DocumentService {
  constructor() {
    this.analyzer = new SimpleAnalyzer();
  }

  async analyzeDocument(file) {
    try {
      const fileType = this.getFileType(file.mimetype);

      if (fileType === 'UNKNOWN') {
        return {
          status: 'invalid',
          confidence: 0,
          details: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            uploadPath: file.path,
            analysis: 'Tipo de archivo no soportado',
          },
          extractedData: {},
          issues: ['Tipo de archivo no soportado para análisis'],
        };
      }

      const analysisResult = await this.analyzer.analyzeDocument(file);

      analysisResult.details = {
        ...analysisResult.details,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadPath: file.path,
      };

      return analysisResult;
    } catch (error) {
      throw new Error(`Error al analizar el documento: ${error.message}`);
    }
  }

  getFileType(mimeType) {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    return 'UNKNOWN';
  }
}

export default DocumentService;
