import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FoodSearchResult, FoodDetail, FoodServing } from '@calories/shared';

const API_URL = 'https://platform.fatsecret.com/rest/server.api';
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';

// ── OAuth 2.0 token management ──────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Gets a valid OAuth 2.0 access token, refreshing if expired.
 * Uses the client_credentials grant type.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${env.FATSECRET_CONSUMER_KEY}:${env.FATSECRET_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    TOKEN_URL,
    'grant_type=client_credentials&scope=basic',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10_000,
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in ?? 86400) * 1000;

  logger.debug('FatSecret OAuth 2.0 token refreshed');
  return cachedToken!;
}

/**
 * Sends an authenticated request to the FatSecret API.
 */
async function makeRequest(params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();

  const response = await axios.get(API_URL, {
    params: { ...params, format: 'json' },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 10_000,
  });

  return response.data;
}

// ── Normalizers ─────────────────────────────────────────────────────

/**
 * Normalizes a FatSecret serving object into our FoodServing type.
 */
function normalizeServing(s: Record<string, unknown>): FoodServing {
  return {
    serving_id: String(s.serving_id ?? ''),
    serving_description: String(s.serving_description ?? ''),
    serving_qty: Number(s.number_of_units ?? 1),
    serving_unit: String(s.measurement_description ?? ''),
    metric_serving_amount: s.metric_serving_amount ? Number(s.metric_serving_amount) : null,
    metric_serving_unit: s.metric_serving_unit ? String(s.metric_serving_unit) : null,
    calories: Number(s.calories ?? 0),
    protein_g: Number(s.protein ?? 0),
    carbs_g: Number(s.carbohydrate ?? 0),
    fat_g: Number(s.fat ?? 0),
  };
}

/**
 * Normalizes a FatSecret food item from search results into our FoodSearchResult.
 */
function normalizeSearchResult(food: Record<string, unknown>): FoodSearchResult {
  const description = String(food.food_description ?? '');
  const parsed = parseFoodDescription(description);

  return {
    external_food_id: String(food.food_id ?? ''),
    food_source: 'fatsecret',
    food_name: String(food.food_name ?? ''),
    brand_name: food.brand_name ? String(food.brand_name) : null,
    calories: parsed.calories,
    protein_g: parsed.protein_g,
    carbs_g: parsed.carbs_g,
    fat_g: parsed.fat_g,
    serving_qty: parsed.serving_qty,
    serving_unit: parsed.serving_unit,
    serving_size_g: null,
  };
}

/**
 * Parses the FatSecret food_description string.
 * Format: "Per <qty> <unit> - Calories: 120kcal | Fat: 5.00g | Carbs: 10.00g | Protein: 8.00g"
 */
function parseFoodDescription(desc: string): {
  serving_qty: number;
  serving_unit: string;
  calories: number;
  fat_g: number;
  carbs_g: number;
  protein_g: number;
} {
  const result = {
    serving_qty: 1,
    serving_unit: 'serving',
    calories: 0,
    fat_g: 0,
    carbs_g: 0,
    protein_g: 0,
  };

  const servingMatch = desc.match(/^Per\s+([\d.]+)\s+(.+?)\s*-/);
  if (servingMatch) {
    result.serving_qty = Number(servingMatch[1]) || 1;
    result.serving_unit = servingMatch[2];
  }

  const calMatch = desc.match(/Calories:\s*([\d.]+)/);
  if (calMatch) result.calories = Number(calMatch[1]) || 0;

  const fatMatch = desc.match(/Fat:\s*([\d.]+)/);
  if (fatMatch) result.fat_g = Number(fatMatch[1]) || 0;

  const carbMatch = desc.match(/Carbs:\s*([\d.]+)/);
  if (carbMatch) result.carbs_g = Number(carbMatch[1]) || 0;

  const protMatch = desc.match(/Protein:\s*([\d.]+)/);
  if (protMatch) result.protein_g = Number(protMatch[1]) || 0;

  return result;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Searches for foods on FatSecret.
 */
export async function searchFoods(query: string, page: number = 0): Promise<FoodSearchResult[]> {
  try {
    const data = (await makeRequest({
      method: 'foods.search',
      search_expression: query,
      page_number: String(page),
      max_results: '20',
    })) as Record<string, unknown>;

    const foods = data.foods as Record<string, unknown> | undefined;
    if (!foods || !foods.food) return [];

    const foodList = Array.isArray(foods.food) ? foods.food : [foods.food];
    return foodList.map((f: Record<string, unknown>) => normalizeSearchResult(f));
  } catch (error) {
    logger.error({ error, query, page }, 'FatSecret searchFoods failed');
    throw error;
  }
}

/**
 * Gets detailed food info by FatSecret food ID.
 */
export async function getFoodById(foodId: string): Promise<FoodDetail> {
  try {
    const data = (await makeRequest({
      method: 'food.get.v4',
      food_id: foodId,
    })) as Record<string, unknown>;

    const food = data.food as Record<string, unknown>;
    if (!food) {
      throw Object.assign(new Error(`Food not found: ${foodId}`), { status: 404 });
    }

    const servingsContainer = food.servings as Record<string, unknown>;
    const rawServings = servingsContainer?.serving;
    const servingsList: Record<string, unknown>[] = rawServings
      ? Array.isArray(rawServings)
        ? rawServings
        : [rawServings]
      : [];

    const servings = servingsList.map(normalizeServing);
    const defaultServing = servings[0];

    return {
      external_food_id: String(food.food_id ?? foodId),
      food_source: 'fatsecret',
      food_name: String(food.food_name ?? ''),
      brand_name: food.brand_name ? String(food.brand_name) : null,
      calories: defaultServing?.calories ?? 0,
      protein_g: defaultServing?.protein_g ?? 0,
      carbs_g: defaultServing?.carbs_g ?? 0,
      fat_g: defaultServing?.fat_g ?? 0,
      fiber_g: Number((servingsList[0] as Record<string, unknown>)?.fiber ?? 0),
      sugar_g: Number((servingsList[0] as Record<string, unknown>)?.sugar ?? 0),
      sodium_mg: Number((servingsList[0] as Record<string, unknown>)?.sodium ?? 0),
      serving_qty: defaultServing?.serving_qty ?? 1,
      serving_unit: defaultServing?.serving_unit ?? 'serving',
      serving_size_g: defaultServing?.metric_serving_amount ?? null,
      servings,
    };
  } catch (error) {
    logger.error({ error, foodId }, 'FatSecret getFoodById failed');
    throw error;
  }
}

/**
 * Finds a food by barcode using FatSecret's barcode lookup.
 * Returns null if no match found.
 */
export async function findByBarcode(barcode: string): Promise<FoodDetail | null> {
  try {
    const data = (await makeRequest({
      method: 'food.find_id_for_barcode',
      barcode,
    })) as Record<string, unknown>;

    const foodIdContainer = data.food_id as Record<string, unknown> | undefined;
    const foodId = foodIdContainer?.value as string | undefined;

    if (!foodId) return null;

    return getFoodById(foodId);
  } catch (error) {
    logger.warn({ error, barcode }, 'FatSecret findByBarcode failed');
    return null;
  }
}
