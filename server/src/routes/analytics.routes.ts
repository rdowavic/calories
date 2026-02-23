import { Router } from 'express';
import * as analyticsService from '../services/analytics.service';

const router = Router();

router.post('/events', async (req, res) => {
  const userId = (req as any).userId!;
  const { eventType, metadata, durationMs } = req.body;
  await analyticsService.trackEvent(userId, eventType, metadata, durationMs);
  res.json({ success: true, data: null });
});

export default router;
