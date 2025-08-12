import User from './User.js';
import Document from './Document.js';

// Un usuario puede tener muchos documentos
User.hasMany(Document, {
  foreignKey: 'userId',
  as: 'documents',
});

// Un documento pertenece a un usuario
Document.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { User, Document };
