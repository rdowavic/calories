import { Router } from 'express';
import * as exportController from '../controllers/export.controller';

const router = Router();

router.get('/csv', exportController.exportCsv);

export default router;
