import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireGestor } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { registerSchema, loginSchema } from './auth.schemas';
import * as authController from './auth.controller';
import * as usersController from './users.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authController.logout);
router.get('/users', authMiddleware, requireGestor, usersController.listUsers);

export default router;
