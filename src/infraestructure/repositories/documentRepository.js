import Document from '../database/models/Document.js';

class DocumentRepository {
  async saveDocument(documentData) {
    try {
      return await Document.create(documentData);
    } catch (error) {
      console.error('Error al guardar el documento: ', error);
      throw error;
    }
  }

  async getDocumentsByJobId(jobId) {
    try {
      return await Document.findAll({
        where: { jobId },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      console.error('Error al obtener documentos por jobId: ', error);
      throw error;
    }
  }

  async getDocumentByUserId(userId, limit = 20, offset = 0) {
    try {
      return await Document.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error al obtener documentos por userId: ', error);
      throw error;
    }
  }

  async getAllDocuments(limit = 20, offset = 0) {
    try {
      return await Document.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error al obtener todos los documentos: ', error);
      throw error;
    }
  }
}

export default new DocumentRepository();
