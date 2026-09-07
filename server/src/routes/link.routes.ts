import { Router } from 'express';
import {
  createLinkHandler,
  deleteLinkHandler,
  disableLinkHandler,
  enableLinkHandler,
  getLinkHandler,
  listLinksHandler,
  updateLinkHandler,
} from '../controllers/link.controller';
import { optionalAuth, authenticate } from '../middleware/auth';
import { linkCreateRateLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { createLinkSchema, idParamSchema, listLinksQuerySchema, updateLinkSchema } from '../schemas/link.schema';
import analyticsRoutes from './analytics.routes';
import qrRoutes from './qr.routes';

const router = Router();

router.post('/', optionalAuth, linkCreateRateLimiter, validateBody(createLinkSchema), createLinkHandler);

const protectedRouter = Router({ mergeParams: true });
protectedRouter.use(authenticate);

protectedRouter.get('/', validateQuery(listLinksQuerySchema), listLinksHandler);

protectedRouter.get('/:id', validateParams(idParamSchema), getLinkHandler);
protectedRouter.put('/:id', validateParams(idParamSchema), validateBody(updateLinkSchema), updateLinkHandler);
protectedRouter.delete('/:id', validateParams(idParamSchema), deleteLinkHandler);
protectedRouter.post('/:id/disable', validateParams(idParamSchema), disableLinkHandler);
protectedRouter.post('/:id/enable', validateParams(idParamSchema), enableLinkHandler);

protectedRouter.use('/:id/analytics', analyticsRoutes);
protectedRouter.use('/:id/qr', qrRoutes);

router.use(protectedRouter);

export default router;