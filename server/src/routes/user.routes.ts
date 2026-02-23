import { Router } from 'express';
import {
  getMe,
  updateMe,
  completeOnboarding,
  updatePreferences,
} from '../controllers/user.controller';

const router = Router();

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/onboarding', completeOnboarding);
router.put('/me/preferences', updatePreferences);

export default router;
