import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import authService from '../../../src/domain/services/auth/authService.js';
import userRepository from '../../../src/infraestructure/repositories/userRepository.js';
import {
  mockUser,
  mockToken,
  mockRegisterData,
  mockLoginData,
} from '../../mocks/index.js';

describe('AuthService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario con éxito', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);
      jest.spyOn(jwt, 'sign').mockReturnValue(mockToken);

      const result = await authService.register(mockRegisterData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockRegisterData.email
      );
      expect(userRepository.createUser).toHaveBeenCalledWith(mockRegisterData);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        token: mockToken,
      });
    });

    it('debería lanzar un error cuando el email ya está registrado', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      const createSpy = jest
        .spyOn(userRepository, 'createUser')
        .mockResolvedValue(null);
      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        'El correo electronico ya esta registrado'
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockRegisterData.email
      );
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('debería iniciar sesión con éxito', async () => {
      const userWithMethod = {
        ...mockUser,
        validPassword: jest.fn().mockResolvedValue(true),
      };
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(userWithMethod);
      jest.spyOn(jwt, 'sign').mockReturnValue(mockToken);

      const result = await authService.login(
        mockLoginData.email,
        mockLoginData.password
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginData.email
      );
      expect(userWithMethod.validPassword).toHaveBeenCalledWith(
        mockLoginData.password
      );
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        token: mockToken,
      });
    });

    it('debería lanzar un error cuando el usuario no existe', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.login(mockLoginData.email, mockLoginData.password)
      ).rejects.toThrow('Usuario no encontrado');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginData.email
      );
    });

    it('debería lanzar un error cuando la contraseña es incorrecta', async () => {
      const userWithMethod = {
        ...mockUser,
        validPassword: jest.fn().mockResolvedValue(false),
      };
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(userWithMethod);

      await expect(
        authService.login(mockLoginData.email, mockLoginData.password)
      ).rejects.toThrow('Contraseña incorrecta');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginData.email
      );
      expect(userWithMethod.validPassword).toHaveBeenCalledWith(
        mockLoginData.password
      );
    });
  });

  describe('generateToken', () => {
    it('debería generar un token JWT válido', () => {
      jest.spyOn(jwt, 'sign').mockReturnValue(mockToken);

      const token = authService.generateToken(mockUser);

      // Verificaciones
      expect(jwt.sign).toHaveBeenCalled();
      expect(token).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('debería verificar un token JWT válido', () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });

      const result = authService.verifyToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, authService.jwtSecret);
      expect(result).toEqual({
        sub: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('debería lanzar un error cuando el token es inválido', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Token inválido');
      });

      expect(() => authService.verifyToken('invalid-token')).toThrow(
        'Token invalido'
      );
      expect(jwt.verify).toHaveBeenCalledWith(
        'invalid-token',
        authService.jwtSecret
      );
    });
  });
});
