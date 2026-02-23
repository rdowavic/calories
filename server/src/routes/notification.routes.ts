import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.post('/register', notificationController.registerToken);
router.delete('/register', notificationController.unregisterToken);

export default router;
