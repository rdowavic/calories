import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as recipeService from '../services/recipe.service';

export async function getRecipes(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const recipes = await recipeService.getRecipes(userId);
  res.json({ success: true, data: recipes });
}

export async function getRecipeById(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const recipe = await recipeService.getRecipeById(userId, id);
  if (!recipe) {
    return res.status(404).json({ success: false, error: 'Recipe not found' });
  }
  res.json({ success: true, data: recipe });
}

export async function createRecipe(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const recipe = await recipeService.createRecipe(userId, req.body);
  res.status(201).json({ success: true, data: recipe });
}

export async function updateRecipe(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const recipe = await recipeService.updateRecipe(userId, id, req.body);
  res.json({ success: true, data: recipe });
}

export async function deleteRecipe(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  await recipeService.deleteRecipe(userId, id);
  res.json({ success: true, data: null });
}

export async function logRecipe(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const { servings, mealCategory, loggedDate } = req.body;
  const log = await recipeService.logRecipe(userId, id, servings, mealCategory, loggedDate);
  res.status(201).json({ success: true, data: log });
}
