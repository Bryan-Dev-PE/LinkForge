import { Router } from 'express';
import { getQrHandler, saveQrHandler } from '../controllers/qr.controller';
import { validateBody } from '../middleware/validate';
import { saveQrSchema } from '../schemas/qr.schema';

const router = Router({ mergeParams: true });

router.get('/', getQrHandler);
router.post('/', validateBody(saveQrSchema), saveQrHandler);

export default router;