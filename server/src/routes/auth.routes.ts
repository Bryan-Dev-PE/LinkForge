import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter, forgotPasswordRateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', forgotPasswordRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.put('/profile', authenticate, updateProfile);

export default router;