import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
});

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexióin a la base de datos establecida');
    await sequelize.sync('Modelos sincronizados con la base de dato');
  } catch (error) {
    console.error('Error al conectar a la base de datos: ', error);
    throw error;
  }
};

export default sequelize;
