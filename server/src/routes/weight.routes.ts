import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { createWeightEntrySchema } from '@calories/shared';
import * as weightController from '../controllers/weight.controller';

const router = Router();

router.get('/', weightController.getWeightEntries);
router.post('/', validateBody(createWeightEntrySchema), weightController.createWeightEntry);
router.delete('/:id', weightController.deleteWeightEntry);

export default router;
