import User from '../database/models/User.js';

class UserRepository {
  async createUser(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      console.error('Error al crear usuario: ', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({
        where: { email },
      });
    } catch (error) {
      console.error('Error al buscar usuario por email: ', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await User.findByPk(id);
    } catch (error) {
      console.error('Error al buscar usuario por ID: ', error);
      throw error;
    }
  }
}

export default new UserRepository();
