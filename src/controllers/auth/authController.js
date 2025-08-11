import authService from '../../domain/services/auth/authService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Todos los campos son obligatorios',
        });
      }

      const userData = await authService.register({ name, email, password });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Usuario registrado exitosamente',
        data: userData,
      });
    } catch (error) {
      if (error.message === 'El correo electrónico ya está registrado') {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Correo y contraseña son obligatorios',
        });
      }

      const userData = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Inicio de sesión exitoso',
        data: userData,
      });
    } catch (error) {
      if (
        error.message === 'Usuario no encontrado' ||
        error.message === 'Contraseña incorrecta'
      ) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Credenciales inválidas',
        });
      }
      next(error);
    }
  }

  async getProfile(req, res) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        user: {
          id: req.user.sub,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  }
}

export default new AuthController();
