import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { googleSignIn, devSignIn } from '../controllers/auth.controller';

const router = Router();

router.post('/google', authLimiter, googleSignIn);

// Dev-only sign-in endpoint — creates or returns a test user without Google OAuth.
// Only available when NODE_ENV=development
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-signin', devSignIn);
}

export default router;
