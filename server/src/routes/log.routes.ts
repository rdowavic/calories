import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { createFoodLogSchema, updateFoodLogSchema } from '@calories/shared';
import * as logController from '../controllers/log.controller';

const router = Router();

router.get('/', logController.getLogsByDate);
router.get('/range', logController.getLogsByRange);
router.post('/', validateBody(createFoodLogSchema), logController.createLog);
router.put('/:id', validateBody(updateFoodLogSchema), logController.updateLog);
router.delete('/:id', logController.deleteLog);
router.post('/:id/favorite', logController.addToFavorites);

export default router;
