import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  authentication,
  isAdmin,
} from '../../../src/middlewares/authMiddleware.js';
import authService from '../../../src/domain/services/auth/authService.js';
import { mockToken, mockExpressParams } from '../../mocks/index.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.restoreAllMocks();

    const expressParams = mockExpressParams();
    req = expressParams.req;
    res = expressParams.res;
    next = expressParams.next;

    delete req.headers;
    delete req.user;
  });

  describe('authentication', () => {
    it('debería pasar la autenticación con un token válido', async () => {
      req.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      const decodedToken = {
        sub: 1,
        name: 'Usuario Test',
        email: 'test@example.com',
        role: 'user',
      };

      jest.spyOn(authService, 'verifyToken').mockReturnValue(decodedToken);

      await authentication(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);

      expect(req.user).toEqual(decodedToken);

      expect(next).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debería devolver 401 cuando no hay token', async () => {
      req.headers = {};

      await authentication(req, res, next);

      const spy = jest.spyOn(authService, 'verifyToken');
      expect(spy).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: 'Acceso no autorizado, Token no proporcionado',
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('debería devolver 401 cuando el formato del token es incorrecto', async () => {
      req.headers = {
        authorization: mockToken, // Sin "Bearer "
      };

      await authentication(req, res, next);

      const spy2 = jest.spyOn(authService, 'verifyToken');
      expect(spy2).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: 'Formato de token incorrecto',
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('debería devolver 401 cuando el token es inválido', async () => {
      req.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      const error = new Error('Token inválido');
      jest.spyOn(authService, 'verifyToken').mockImplementation(() => {
        throw error;
      });

      await authentication(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: error.message,
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('debería permitir acceso a un administrador', () => {
      req.user = {
        sub: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debería denegar acceso a un usuario no administrador', () => {
      req.user = {
        sub: 1,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
      };

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 403,
        message: 'Acceso prohibido. Se requiere rol de administrador',
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso cuando no hay usuario autenticado', () => {
      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 403,
        message: 'Acceso prohibido. Se requiere rol de administrador',
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});
