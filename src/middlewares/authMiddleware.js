import authService from '../domain/services/auth/authService.js';

export const authentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Acceso no autorizado, Token no proporcionado',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Formato de token incorrecto',
      });
    }

    const token = parts[1];

    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: error.message || 'Acceso no autorizado',
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Acceso prohibido. Se requiere rol de administrador',
    });
  }
};
