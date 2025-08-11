import jwt from 'jsonwebtoken';
import userRepository from '../../../infraestructure/repositories/userRepository.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'secret-key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '1h';
  }

  async register(userData) {
    try {
      const existingUser = await userRepository.findByEmail(userData.email);

      if (existingUser) {
        throw new Error('El correo electronico ya esta registrado');
      }

      const user = await userRepository.createUser(userData);

      const token = this.generateToken(user);

      return {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await userRepository.findByEmail(email);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const isPasswordValid = await user.validPassword(password);
      if (!isPasswordValid) {
        throw new Error('Contrena incorrecta');
      }

      const token = this.generateToken(user);

      return {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  generateToken(user) {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Date.now(),
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Token invalido');
    }
  }
}

export default new AuthService();
