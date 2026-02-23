import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  Recipe,
  RecipeIngredient,
  CreateRecipeInput,
  MealCategory,
} from '@calories/shared';
import * as logService from './log.service';

/**
 * Gets all recipes belonging to a user.
 */
export async function getRecipes(userId: string): Promise<Recipe[]> {
  return db('recipes')
    .where({ user_id: userId })
    .orderBy('updated_at', 'desc');
}

/**
 * Gets a single recipe with its ingredients.
 */
export async function getRecipeById(
  userId: string,
  recipeId: string
): Promise<{ recipe: Recipe; ingredients: RecipeIngredient[] }> {
  const recipe: Recipe | undefined = await db('recipes')
    .where({ id: recipeId, user_id: userId })
    .first();

  if (!recipe) {
    throw Object.assign(new Error('Recipe not found'), { status: 404 });
  }

  const ingredients: RecipeIngredient[] = await db('recipe_ingredients')
    .where({ recipe_id: recipeId })
    .orderBy('sort_order', 'asc');

  return { recipe, ingredients };
}

/**
 * Computes aggregated nutrition totals from recipe ingredients.
 */
function computeNutritionTotals(
  ingredients: Array<{
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }>
): {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
} {
  return ingredients.reduce(
    (acc, ing) => ({
      total_calories: acc.total_calories + (ing.calories ?? 0),
      total_protein_g: acc.total_protein_g + (ing.protein_g ?? 0),
      total_carbs_g: acc.total_carbs_g + (ing.carbs_g ?? 0),
      total_fat_g: acc.total_fat_g + (ing.fat_g ?? 0),
    }),
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 }
  );
}

/**
 * Creates a recipe with its ingredients.
 * Computes total nutrition aggregated from all ingredients.
 */
export async function createRecipe(
  userId: string,
  data: CreateRecipeInput
): Promise<{ recipe: Recipe; ingredients: RecipeIngredient[] }> {
  const totals = computeNutritionTotals(data.ingredients);

  return db.transaction(async (trx) => {
    const [recipe] = await trx('recipes')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        servings: data.servings,
        total_calories: totals.total_calories,
        total_protein_g: totals.total_protein_g,
        total_carbs_g: totals.total_carbs_g,
        total_fat_g: totals.total_fat_g,
      })
      .returning('*');

    const ingredientRows = data.ingredients.map((ing, index) => ({
      recipe_id: recipe.id,
      food_name: ing.food_name,
      external_food_id: ing.external_food_id ?? null,
      food_source: ing.food_source ?? null,
      calories: ing.calories,
      protein_g: ing.protein_g ?? 0,
      carbs_g: ing.carbs_g ?? 0,
      fat_g: ing.fat_g ?? 0,
      serving_qty: ing.serving_qty,
      serving_unit: ing.serving_unit,
      serving_size_g: ing.serving_size_g ?? null,
      sort_order: index,
    }));

    const ingredients: RecipeIngredient[] = await trx('recipe_ingredients')
      .insert(ingredientRows)
      .returning('*');

    logger.info(
      { userId, recipeId: recipe.id, name: data.name },
      'Recipe created'
    );

    return { recipe, ingredients };
  });
}

/**
 * Updates a recipe and replaces all its ingredients.
 */
export async function updateRecipe(
  userId: string,
  recipeId: string,
  data: CreateRecipeInput
): Promise<{ recipe: Recipe; ingredients: RecipeIngredient[] }> {
  const totals = computeNutritionTotals(data.ingredients);

  return db.transaction(async (trx) => {
    // Verify ownership
    const existing = await trx('recipes')
      .where({ id: recipeId, user_id: userId })
      .first();

    if (!existing) {
      throw Object.assign(new Error('Recipe not found'), { status: 404 });
    }

    // Update recipe
    const [recipe] = await trx('recipes')
      .where({ id: recipeId })
      .update({
        name: data.name,
        description: data.description ?? null,
        servings: data.servings,
        total_calories: totals.total_calories,
        total_protein_g: totals.total_protein_g,
        total_carbs_g: totals.total_carbs_g,
        total_fat_g: totals.total_fat_g,
        updated_at: trx.fn.now(),
      })
      .returning('*');

    // Delete old ingredients and insert new ones
    await trx('recipe_ingredients').where({ recipe_id: recipeId }).del();

    const ingredientRows = data.ingredients.map((ing, index) => ({
      recipe_id: recipeId,
      food_name: ing.food_name,
      external_food_id: ing.external_food_id ?? null,
      food_source: ing.food_source ?? null,
      calories: ing.calories,
      protein_g: ing.protein_g ?? 0,
      carbs_g: ing.carbs_g ?? 0,
      fat_g: ing.fat_g ?? 0,
      serving_qty: ing.serving_qty,
      serving_unit: ing.serving_unit,
      serving_size_g: ing.serving_size_g ?? null,
      sort_order: index,
    }));

    const ingredients: RecipeIngredient[] = await trx('recipe_ingredients')
      .insert(ingredientRows)
      .returning('*');

    logger.info(
      { userId, recipeId, name: data.name },
      'Recipe updated'
    );

    return { recipe, ingredients };
  });
}

/**
 * Deletes a recipe. Ingredients are cascade-deleted by the database.
 */
export async function deleteRecipe(
  userId: string,
  recipeId: string
): Promise<void> {
  const deleted = await db('recipes')
    .where({ id: recipeId, user_id: userId })
    .del();

  if (!deleted) {
    throw Object.assign(new Error('Recipe not found'), { status: 404 });
  }

  logger.info({ userId, recipeId }, 'Recipe deleted');
}

/**
 * Creates a food log entry from a recipe, scaling nutrition by the number of servings.
 */
export async function logRecipe(
  userId: string,
  recipeId: string,
  servings: number,
  mealCategory: MealCategory,
  loggedDate: string
): Promise<ReturnType<typeof logService.createLog>> {
  const { recipe } = await getRecipeById(userId, recipeId);

  const scaleFactor = servings / recipe.servings;

  return logService.createLog(userId, {
    food_name: recipe.name,
    food_source: 'recipe',
    calories: Math.round((recipe.total_calories ?? 0) * scaleFactor),
    protein_g: Math.round(((recipe.total_protein_g ?? 0) * scaleFactor) * 10) / 10,
    carbs_g: Math.round(((recipe.total_carbs_g ?? 0) * scaleFactor) * 10) / 10,
    fat_g: Math.round(((recipe.total_fat_g ?? 0) * scaleFactor) * 10) / 10,
    serving_qty: servings,
    serving_unit: servings === 1 ? 'serving' : 'servings',
    meal_category: mealCategory,
    logged_date: loggedDate,
    input_method: 'recipe',
    recipe_id: recipeId,
  });
}
