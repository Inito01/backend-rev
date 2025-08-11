import { Router } from 'express';
import authController from '../controllers/auth/authController.js';
import { authentication } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authentication, authController.getProfile);

export default router;
