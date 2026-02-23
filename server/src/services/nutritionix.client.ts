import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FoodSearchResult, FoodDetail, FoodServing } from '@calories/shared';

const BASE_URL = 'https://trackapi.nutritionix.com/v2';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'x-app-id': env.NUTRITIONIX_APP_ID,
    'x-app-key': env.NUTRITIONIX_APP_KEY,
    'Content-Type': 'application/json',
  },
});

interface NixCommonFood {
  food_name: string;
  serving_unit: string;
  serving_qty: number;
  tag_id: string;
  photo?: { thumb?: string };
  nf_calories?: number;
}

interface NixBrandedFood {
  food_name: string;
  brand_name: string | null;
  serving_unit: string;
  serving_qty: number;
  nix_item_id: string;
  nf_calories: number;
  photo?: { thumb?: string };
}

interface NixDetailedFood {
  food_name: string;
  brand_name: string | null;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number | null;
  nf_calories: number;
  nf_total_fat: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_dietary_fiber: number;
  nf_sugars: number;
  nf_sodium: number;
  nix_item_id?: string;
  nix_brand_id?: string;
  alt_measures?: Array<{
    serving_weight: number;
    measure: string;
    qty: number;
    seq: number | null;
  }>;
  upc?: string;
}

/**
 * Normalizes a Nutritionix common food item to FoodSearchResult.
 */
function normalizeCommon(food: NixCommonFood): FoodSearchResult {
  return {
    external_food_id: food.tag_id || food.food_name,
    food_source: 'nutritionix',
    food_name: food.food_name,
    brand_name: null,
    calories: food.nf_calories ?? 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    serving_qty: food.serving_qty,
    serving_unit: food.serving_unit,
    serving_size_g: null,
  };
}

/**
 * Normalizes a Nutritionix branded food item to FoodSearchResult.
 */
function normalizeBranded(food: NixBrandedFood): FoodSearchResult {
  return {
    external_food_id: food.nix_item_id,
    food_source: 'nutritionix',
    food_name: food.food_name,
    brand_name: food.brand_name ?? null,
    calories: food.nf_calories ?? 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    serving_qty: food.serving_qty,
    serving_unit: food.serving_unit,
    serving_size_g: null,
  };
}

/**
 * Normalizes a detailed Nutritionix food to FoodDetail.
 */
function normalizeDetailed(food: NixDetailedFood): FoodDetail {
  const servings: FoodServing[] = [];

  // Primary serving
  servings.push({
    serving_id: 'primary',
    serving_description: `${food.serving_qty} ${food.serving_unit}`,
    serving_qty: food.serving_qty,
    serving_unit: food.serving_unit,
    metric_serving_amount: food.serving_weight_grams,
    metric_serving_unit: food.serving_weight_grams ? 'g' : null,
    calories: food.nf_calories,
    protein_g: food.nf_protein,
    carbs_g: food.nf_total_carbohydrate,
    fat_g: food.nf_total_fat,
  });

  // Alternative measures
  if (food.alt_measures) {
    for (const alt of food.alt_measures) {
      if (alt.measure === food.serving_unit && alt.qty === food.serving_qty) continue;

      const ratio = food.serving_weight_grams
        ? alt.serving_weight / food.serving_weight_grams
        : 1;

      servings.push({
        serving_id: `alt-${alt.seq ?? alt.measure}`,
        serving_description: `${alt.qty} ${alt.measure}`,
        serving_qty: alt.qty,
        serving_unit: alt.measure,
        metric_serving_amount: alt.serving_weight,
        metric_serving_unit: 'g',
        calories: Math.round(food.nf_calories * ratio),
        protein_g: Math.round(food.nf_protein * ratio * 10) / 10,
        carbs_g: Math.round(food.nf_total_carbohydrate * ratio * 10) / 10,
        fat_g: Math.round(food.nf_total_fat * ratio * 10) / 10,
      });
    }
  }

  return {
    external_food_id: food.nix_item_id || food.food_name,
    food_source: 'nutritionix',
    food_name: food.food_name,
    brand_name: food.brand_name ?? null,
    calories: food.nf_calories,
    protein_g: food.nf_protein,
    carbs_g: food.nf_total_carbohydrate,
    fat_g: food.nf_total_fat,
    fiber_g: food.nf_dietary_fiber ?? 0,
    sugar_g: food.nf_sugars ?? 0,
    sodium_mg: food.nf_sodium ?? 0,
    serving_qty: food.serving_qty,
    serving_unit: food.serving_unit,
    serving_size_g: food.serving_weight_grams ?? null,
    servings,
  };
}

/**
 * Searches Nutritionix instant endpoint for both common and branded foods.
 * Merges results into a single FoodSearchResult array.
 */
export async function searchInstant(query: string): Promise<FoodSearchResult[]> {
  try {
    const response = await client.get('/search/instant', {
      params: { query },
    });

    const { common = [], branded = [] } = response.data;

    const commonResults = (common as NixCommonFood[]).map(normalizeCommon);
    const brandedResults = (branded as NixBrandedFood[]).map(normalizeBranded);

    return [...commonResults, ...brandedResults];
  } catch (error) {
    logger.error({ error, query }, 'Nutritionix searchInstant failed');
    throw error;
  }
}

/**
 * Gets detailed nutrient info for a natural language food query.
 */
export async function getNutrients(query: string): Promise<FoodDetail> {
  try {
    const response = await client.post('/natural/nutrients', { query });

    const foods = response.data.foods as NixDetailedFood[];
    if (!foods || foods.length === 0) {
      throw Object.assign(new Error(`No nutrient data found for: ${query}`), { status: 404 });
    }

    return normalizeDetailed(foods[0]);
  } catch (error) {
    logger.error({ error, query }, 'Nutritionix getNutrients failed');
    throw error;
  }
}

/**
 * Looks up a food by UPC barcode on Nutritionix.
 * Returns null if not found.
 */
export async function findByUPC(upc: string): Promise<FoodDetail | null> {
  try {
    const response = await client.get('/search/item', {
      params: { upc },
    });

    const foods = response.data.foods as NixDetailedFood[];
    if (!foods || foods.length === 0) return null;

    return normalizeDetailed(foods[0]);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    logger.warn({ error, upc }, 'Nutritionix findByUPC failed');
    return null;
  }
}
