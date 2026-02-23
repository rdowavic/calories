import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.get('/analytics/overview', adminController.getOverview);
router.get('/analytics/time-to-log', adminController.getTimeToLog);
router.get('/analytics/projection-usage', adminController.getProjectionUsage);
router.get('/analytics/engagement', adminController.getEngagement);

export default router;
