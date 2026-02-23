import { Router } from 'express';
import * as foodController from '../controllers/food.controller';

const router = Router();

router.get('/search', foodController.searchFoods);
router.get('/barcode/:code', foodController.getFoodByBarcode);
router.get('/frequent', foodController.getFrequentFoods);
router.get('/:id', foodController.getFoodDetail);

export default router;
