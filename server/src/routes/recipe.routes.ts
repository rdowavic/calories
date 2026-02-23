import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { createRecipeSchema } from '@calories/shared';
import * as recipeController from '../controllers/recipe.controller';

const router = Router();

router.get('/', recipeController.getRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/', validateBody(createRecipeSchema), recipeController.createRecipe);
router.put('/:id', validateBody(createRecipeSchema.partial()), recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);
router.post('/:id/log', recipeController.logRecipe);

export default router;
