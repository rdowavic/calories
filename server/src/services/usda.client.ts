import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FoodSearchResult, FoodDetail, FoodServing } from '@calories/shared';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
});

/**
 * Known USDA nutrient IDs for macro/micro nutrients.
 */
const NUTRIENT_IDS = {
  calories: [1008, 2048], // Energy (kcal), Energy (Atwater)
  protein: [1003],
  fat: [1004],
  carbs: [1005],
  fiber: [1079],
  sugar: [2000, 1063], // Total sugars
  sodium: [1093],
} as const;

/**
 * Finds a nutrient value from USDA's foodNutrients array by nutrient ID or name.
 */
function findNutrient(
  nutrients: Array<Record<string, unknown>>,
  ids: readonly number[],
  fallbackName?: string
): number {
  // Try by nutrient ID first
  for (const id of ids) {
    const found = nutrients.find((n) => {
      const nutrient = n.nutrient as Record<string, unknown> | undefined;
      const nutrientId = nutrient?.id ?? n.nutrientId ?? n.nutrientNumber;
      return Number(nutrientId) === id;
    });
    if (found) {
      return Number(found.amount ?? found.value ?? 0);
    }
  }

  // Fallback: search by name
  if (fallbackName) {
    const found = nutrients.find((n) => {
      const nutrient = n.nutrient as Record<string, unknown> | undefined;
      const name = String(nutrient?.name ?? n.nutrientName ?? '').toLowerCase();
      return name.includes(fallbackName.toLowerCase());
    });
    if (found) {
      return Number(found.amount ?? found.value ?? 0);
    }
  }

  return 0;
}

/**
 * Normalizes a USDA search result food item to our FoodSearchResult type.
 */
function normalizeSearchResult(food: Record<string, unknown>): FoodSearchResult {
  const nutrients = (food.foodNutrients as Array<Record<string, unknown>>) || [];

  return {
    external_food_id: String(food.fdcId ?? ''),
    food_source: 'usda',
    food_name: String(food.description ?? ''),
    brand_name: food.brandName ? String(food.brandName) : food.brandOwner ? String(food.brandOwner) : null,
    calories: findNutrient(nutrients, NUTRIENT_IDS.calories, 'energy'),
    protein_g: findNutrient(nutrients, NUTRIENT_IDS.protein, 'protein'),
    carbs_g: findNutrient(nutrients, NUTRIENT_IDS.carbs, 'carbohydrate'),
    fat_g: findNutrient(nutrients, NUTRIENT_IDS.fat, 'total lipid'),
    serving_qty: 1,
    serving_unit: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
      : '100g',
    serving_size_g: food.servingSize ? Number(food.servingSize) : 100,
  };
}

/**
 * Builds FoodServing entries from USDA food portions.
 */
function buildServings(
  food: Record<string, unknown>,
  nutrients: Array<Record<string, unknown>>
): FoodServing[] {
  const servings: FoodServing[] = [];
  const portions = (food.foodPortions as Array<Record<string, unknown>>) || [];

  // Default 100g serving
  const caloriesPer100g = findNutrient(nutrients, NUTRIENT_IDS.calories, 'energy');
  const proteinPer100g = findNutrient(nutrients, NUTRIENT_IDS.protein, 'protein');
  const carbsPer100g = findNutrient(nutrients, NUTRIENT_IDS.carbs, 'carbohydrate');
  const fatPer100g = findNutrient(nutrients, NUTRIENT_IDS.fat, 'total lipid');

  servings.push({
    serving_id: '100g',
    serving_description: '100g',
    serving_qty: 100,
    serving_unit: 'g',
    metric_serving_amount: 100,
    metric_serving_unit: 'g',
    calories: caloriesPer100g,
    protein_g: proteinPer100g,
    carbs_g: carbsPer100g,
    fat_g: fatPer100g,
  });

  for (const portion of portions) {
    const gramWeight = Number(portion.gramWeight ?? 0);
    if (gramWeight <= 0) continue;

    const ratio = gramWeight / 100;
    const portionDesc = portion.modifier
      ? String(portion.modifier)
      : portion.measureUnit
        ? `${portion.amount ?? 1} ${(portion.measureUnit as Record<string, unknown>)?.name ?? 'serving'}`
        : `${gramWeight}g`;

    servings.push({
      serving_id: String(portion.id ?? portionDesc),
      serving_description: portionDesc,
      serving_qty: Number(portion.amount ?? 1),
      serving_unit: portion.modifier
        ? String(portion.modifier)
        : String((portion.measureUnit as Record<string, unknown>)?.name ?? 'serving'),
      metric_serving_amount: gramWeight,
      metric_serving_unit: 'g',
      calories: Math.round(caloriesPer100g * ratio),
      protein_g: Math.round(proteinPer100g * ratio * 10) / 10,
      carbs_g: Math.round(carbsPer100g * ratio * 10) / 10,
      fat_g: Math.round(fatPer100g * ratio * 10) / 10,
    });
  }

  return servings;
}

/**
 * Searches for foods on the USDA FoodData Central database.
 * Only returns Foundation and SR Legacy data types for higher quality results.
 */
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  try {
    const response = await client.get('/foods/search', {
      params: {
        query,
        dataType: 'Foundation,SR Legacy',
        pageSize: 25,
        api_key: env.USDA_API_KEY,
      },
    });

    const foods = (response.data.foods as Array<Record<string, unknown>>) || [];
    return foods.map(normalizeSearchResult);
  } catch (error) {
    logger.error({ error, query }, 'USDA searchFoods failed');
    throw error;
  }
}

/**
 * Gets detailed food info by FDC ID from the USDA database.
 */
export async function getFoodById(fdcId: string): Promise<FoodDetail> {
  try {
    const response = await client.get(`/food/${fdcId}`, {
      params: { api_key: env.USDA_API_KEY },
    });

    const food = response.data as Record<string, unknown>;
    if (!food || !food.fdcId) {
      throw Object.assign(new Error(`USDA food not found: ${fdcId}`), { status: 404 });
    }

    const nutrients = (food.foodNutrients as Array<Record<string, unknown>>) || [];
    const servings = buildServings(food, nutrients);
    const defaultServing = servings[0];

    return {
      external_food_id: String(food.fdcId),
      food_source: 'usda',
      food_name: String(food.description ?? ''),
      brand_name: food.brandName ? String(food.brandName) : food.brandOwner ? String(food.brandOwner) : null,
      calories: defaultServing?.calories ?? 0,
      protein_g: defaultServing?.protein_g ?? 0,
      carbs_g: defaultServing?.carbs_g ?? 0,
      fat_g: defaultServing?.fat_g ?? 0,
      fiber_g: findNutrient(nutrients, NUTRIENT_IDS.fiber, 'fiber'),
      sugar_g: findNutrient(nutrients, NUTRIENT_IDS.sugar, 'sugar'),
      sodium_mg: findNutrient(nutrients, NUTRIENT_IDS.sodium, 'sodium'),
      serving_qty: defaultServing?.serving_qty ?? 100,
      serving_unit: defaultServing?.serving_unit ?? 'g',
      serving_size_g: defaultServing?.metric_serving_amount ?? 100,
      servings,
    };
  } catch (error) {
    logger.error({ error, fdcId }, 'USDA getFoodById failed');
    throw error;
  }
}
