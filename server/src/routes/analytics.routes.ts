import { Router } from 'express';
import {
  getBrowsers,
  getClicks,
  getCountries,
  getDevices,
  getOperatingSystems,
  getReferrers,
  getSummary,
} from '../controllers/analytics.controller';
import { analyticsRateLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(analyticsRateLimiter);

router.get('/', getSummary);
router.get('/summary', getSummary);
router.get('/clicks', getClicks);
router.get('/devices', getDevices);
router.get('/browsers', getBrowsers);
router.get('/operating-systems', getOperatingSystems);
router.get('/countries', getCountries);
router.get('/referrers', getReferrers);

export default router;