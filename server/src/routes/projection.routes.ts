import { Router } from 'express';
import * as projectionController from '../controllers/projection.controller';

const router = Router();

router.get('/', projectionController.getProjection);

export default router;
