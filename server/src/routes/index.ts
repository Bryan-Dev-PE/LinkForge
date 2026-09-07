import { Router } from 'express';
import authRoutes from './auth.routes';
import linkRoutes from './link.routes';
import { redirectRateLimiter } from '../middleware/rateLimiter';
import { redirectHandler } from '../controllers/redirect.controller';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/api/auth', authRoutes);
router.use('/api/links', linkRoutes);

router.get('/:code', redirectRateLimiter, redirectHandler);

export default router;