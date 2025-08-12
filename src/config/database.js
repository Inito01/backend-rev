import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseDir = path.join(__dirname, '../../data');
const databasePath = path.join(databaseDir, 'database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
});

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexióin a la base de datos establecida');

    await import('../infraestructure/database/models/associations.js');

    await sequelize.sync();
  } catch (error) {
    console.error('Error al conectar a la base de datos: ', error);
    throw error;
  }
};

export default sequelize;
