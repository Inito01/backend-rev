import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userRepository from '../../../src/infraestructure/repositories/userRepository.js';
import User from '../../../src/infraestructure/database/models/User.js';
import { mockUser, mockRegisterData } from '../../mocks/index.js';

describe('UserRepository', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('createUser', () => {
    it('debería crear un usuario correctamente', async () => {
      jest.spyOn(User, 'create').mockResolvedValue(mockUser);

      const result = await userRepository.createUser(mockRegisterData);

      expect(User.create).toHaveBeenCalledWith(mockRegisterData);
      expect(result).toEqual(mockUser);
    });

    it('debería manejar errores al crear un usuario', async () => {
      const error = new Error('Error de base de datos');
      jest.spyOn(User, 'create').mockRejectedValue(error);

      await expect(userRepository.createUser(mockRegisterData)).rejects.toThrow(
        error
      );

      expect(User.create).toHaveBeenCalledWith(mockRegisterData);
    });
  });

  describe('findByEmail', () => {
    it('debería encontrar un usuario por email', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail(mockUser.email);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('debería devolver null cuando no encuentra un usuario', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      const result = await userRepository.findByEmail(
        'nonexistent@example.com'
      );

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('debería manejar errores al buscar por email', async () => {
      const error = new Error('Error de base de datos');
      jest.spyOn(User, 'findOne').mockRejectedValue(error);

      await expect(userRepository.findByEmail(mockUser.email)).rejects.toThrow(
        error
      );

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });
  });

  describe('findById', () => {
    it('debería encontrar un usuario por ID', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

      const result = await userRepository.findById(mockUser.id);

      expect(User.findByPk).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('debería devolver null cuando no encuentra un usuario por ID', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const result = await userRepository.findById(999);

      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('debería manejar errores al buscar por ID', async () => {
      const error = new Error('Error de base de datos');
      jest.spyOn(User, 'findByPk').mockRejectedValue(error);

      await expect(userRepository.findById(mockUser.id)).rejects.toThrow(error);

      expect(User.findByPk).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
