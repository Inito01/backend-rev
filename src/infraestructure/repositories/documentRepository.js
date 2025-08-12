import Document from '../database/models/Document.js';
import User from '../database/models/User.js';

class DocumentRepository {
  async saveDocument(documentData) {
    try {
      return await Document.create(documentData);
    } catch (error) {
      console.error('Error al guardar el documento: ', error);
      throw error;
    }
  }

  async getDocumentsByJobId(jobId, userId = null) {
    try {
      const whereClause = { jobId };

      if (userId) {
        whereClause.userId = userId;
      }

      return await Document.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
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
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
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
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
    } catch (error) {
      console.error('Error al obtener todos los documentos: ', error);
      throw error;
    }
  }
}

export default new DocumentRepository();
