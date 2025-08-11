import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import authController from '../../../src/controllers/auth/authController.js';
import authService from '../../../src/domain/services/auth/authService.js';
import {
  mockRegisterData,
  mockLoginData,
  mockUser,
  mockToken,
  mockExpressParams,
} from '../../mocks/index.js';

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.restoreAllMocks();

    const expressParams = mockExpressParams();
    req = expressParams.req;
    res = expressParams.res;
    next = expressParams.next;
  });

  describe('register', () => {
    it('debería registrar un usuario con éxito', async () => {
      req.body = { ...mockRegisterData };

      const serviceResponse = {
        user: {
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        token: mockToken,
      };

      jest.spyOn(authService, 'register').mockResolvedValue(serviceResponse);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterData);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 201,
        message: 'Usuario registrado exitosamente',
        data: serviceResponse,
      });
    });

    it('debería devolver error 400 cuando faltan campos obligatorios', async () => {
      req.body = { name: 'Test User' }; // Falta email y password
      const spy = jest.spyOn(authService, 'register').mockResolvedValue(null);

      await authController.register(req, res, next);

      expect(spy).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: 'Todos los campos son obligatorios',
      });
    });

    it('debería devolver error 409 cuando el email ya existe', async () => {
      req.body = { ...mockRegisterData };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(
          new Error('El correo electrónico ya está registrado')
        );

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterData);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 409,
        message: 'El correo electrónico ya está registrado',
      });
    });

    it('debería pasar otros errores al middleware de error', async () => {
      req.body = { ...mockRegisterData };

      const error = new Error('Error de servidor');
      jest.spyOn(authService, 'register').mockRejectedValue(error);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterData);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('debería iniciar sesión con éxito', async () => {
      req.body = { ...mockLoginData };

      const serviceResponse = {
        user: {
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        token: mockToken,
      };

      jest.spyOn(authService, 'login').mockResolvedValue(serviceResponse);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginData.email,
        mockLoginData.password
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Inicio de sesión exitoso',
        data: serviceResponse,
      });
    });

    it('debería devolver error 400 cuando faltan campos obligatorios', async () => {
      req.body = { email: 'test@example.com' }; // Falta password
      const spy = jest.spyOn(authService, 'login').mockResolvedValue(null);

      await authController.login(req, res, next);

      expect(spy).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: 'Correo y contraseña son obligatorios',
      });
    });

    it('debería devolver error 401 cuando las credenciales son inválidas', async () => {
      req.body = { ...mockLoginData };

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new Error('Usuario no encontrado'));

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginData.email,
        mockLoginData.password
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
    });

    it('debería pasar otros errores al middleware de error', async () => {
      req.body = { ...mockLoginData };

      const error = new Error('Error de servidor');
      jest.spyOn(authService, 'login').mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginData.email,
        mockLoginData.password
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    it('debería devolver el perfil del usuario autenticado', async () => {
      req.user = {
        sub: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      };

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        data: {
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          },
        },
      });
    });
  });
});
