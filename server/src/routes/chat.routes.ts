import { Router } from 'express';
import { chatLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validateRequest';
import { chatMessageSchema } from '@calories/shared';
import * as chatController from '../controllers/chat.controller';

const router = Router();

router.post('/message', chatLimiter, validateBody(chatMessageSchema), chatController.sendMessage);

export default router;
