import { db } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FoodSearchResult, FoodDetail, FoodSource } from '@calories/shared';
import { foodCache, barcodeCache } from './cache.service';
import * as fatsecretClient from './fatsecret.client';
import * as nutritionixClient from './nutritionix.client';
import * as usdaClient from './usda.client';
import * as openFoodFactsClient from './openfoodfacts.client';

const RESULTS_PER_PAGE = 20;

/**
 * Deduplicates food search results by exact case-insensitive food_name match.
 * Keeps the first occurrence encountered.
 */
function deduplicateResults(results: FoodSearchResult[]): FoodSearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.food_name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Paginates an array of results.
 */
function paginate(results: FoodSearchResult[], page: number): FoodSearchResult[] {
  const start = page * RESULTS_PER_PAGE;
  return results.slice(start, start + RESULTS_PER_PAGE);
}

/**
 * Searches for foods across one or multiple data sources.
 * Results are cached for 5 minutes.
 *
 * If `source` is specified, queries only that source.
 * Otherwise, queries FatSecret and Nutritionix in parallel, merges and deduplicates.
 */
export async function searchFoods(
  query: string,
  page: number = 0,
  source?: FoodSource
): Promise<FoodSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}:${page}:${source ?? 'all'}`;
  const cached = foodCache.get(cacheKey);
  if (cached) {
    logger.debug({ query, page, source, cacheHit: true }, 'Food search cache hit');
    return cached;
  }

  let results: FoodSearchResult[];

  if (source) {
    results = await searchSingleSource(query, page, source);
  } else {
    results = await searchMultipleSources(query, page);
  }

  foodCache.set(cacheKey, results);
  return results;
}

/**
 * Searches a single food data source.
 */
async function searchSingleSource(
  query: string,
  page: number,
  source: FoodSource
): Promise<FoodSearchResult[]> {
  switch (source) {
    case 'fatsecret':
      return fatsecretClient.searchFoods(query, page);
    case 'nutritionix':
      if (!env.FEATURE_NUTRITIONIX) {
        logger.debug('Nutritionix is disabled via feature flag');
        return [];
      }
      return nutritionixClient.searchInstant(query);
    case 'usda':
      if (!env.FEATURE_USDA) {
        logger.debug('USDA is disabled via feature flag');
        return [];
      }
      return usdaClient.searchFoods(query);
    default:
      logger.warn({ source }, 'Unknown food source for search');
      return [];
  }
}

/**
 * Searches FatSecret and Nutritionix in parallel, merges and deduplicates results.
 */
async function searchMultipleSources(
  query: string,
  page: number
): Promise<FoodSearchResult[]> {
  const searches: Promise<FoodSearchResult[]>[] = [
    fatsecretClient.searchFoods(query, page),
  ];

  if (env.FEATURE_NUTRITIONIX) {
    searches.push(nutritionixClient.searchInstant(query));
  } else {
    logger.debug('Nutritionix disabled — searching FatSecret only');
  }

  const results = await Promise.allSettled(searches);
  const combined: FoodSearchResult[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      combined.push(...result.value);
    } else {
      const name = i === 0 ? 'FatSecret' : 'Nutritionix';
      logger.warn({ error: result.reason }, `${name} search failed in parallel query`);
    }
  });

  const deduplicated = deduplicateResults(combined);
  return paginate(deduplicated, 0);
}

/**
 * Looks up a food by barcode.
 * Tries FatSecret first, falls back to Nutritionix.
 * Results are cached for 24 hours.
 */
export async function getFoodByBarcode(barcode: string): Promise<FoodDetail | null> {
  const cached = barcodeCache.get(barcode);
  if (cached) {
    logger.debug({ barcode, cacheHit: true }, 'Barcode cache hit');
    return cached;
  }

  // Try FatSecret first
  let result = await fatsecretClient.findByBarcode(barcode);

  // Fall back to Nutritionix (if enabled)
  if (!result && env.FEATURE_NUTRITIONIX) {
    result = await nutritionixClient.findByUPC(barcode);
  }

  // Fall back to Open Food Facts (free, no API key, great international coverage)
  if (!result) {
    result = await openFoodFactsClient.findByBarcode(barcode);
  }

  if (result) {
    barcodeCache.set(barcode, result);
  }
  return result;
}

/**
 * Gets detailed food information, routing to the appropriate client
 * based on the food source.
 */
export async function getFoodDetail(
  foodId: string,
  source: FoodSource
): Promise<FoodDetail> {
  switch (source) {
    case 'fatsecret':
      return fatsecretClient.getFoodById(foodId);
    case 'nutritionix':
      if (!env.FEATURE_NUTRITIONIX) {
        throw Object.assign(new Error('Nutritionix is currently disabled'), { status: 503 });
      }
      return nutritionixClient.getNutrients(foodId);
    case 'usda':
      if (!env.FEATURE_USDA) {
        throw Object.assign(new Error('USDA is currently disabled'), { status: 503 });
      }
      return usdaClient.getFoodById(foodId);
    case 'manual': {
      // For Open Food Facts items (external_food_id starts with 'off-'), re-fetch via barcode
      if (foodId.startsWith('off-')) {
        const barcode = foodId.replace('off-', '');
        const result = await openFoodFactsClient.findByBarcode(barcode);
        if (result) return result;
      }
      throw Object.assign(new Error(`Food not found: ${foodId}`), { status: 404 });
    }
    default:
      throw Object.assign(new Error(`Unsupported food source: ${source}`), { status: 400 });
  }
}

/**
 * Gets the user's most frequently logged foods from the favorite_foods table.
 * Returns up to 20 results sorted by use_count descending.
 */
export async function getFrequentFoods(userId: string): Promise<FoodSearchResult[]> {
  const favorites = await db('favorite_foods')
    .where({ user_id: userId })
    .orderBy('use_count', 'desc')
    .limit(20);

  return favorites.map((f: Record<string, unknown>) => ({
    external_food_id: String(f.external_food_id ?? ''),
    food_source: f.food_source as FoodSource,
    food_name: String(f.food_name ?? ''),
    brand_name: f.brand_name ? String(f.brand_name) : null,
    calories: Number(f.calories ?? 0),
    protein_g: Number(f.protein_g ?? 0),
    carbs_g: Number(f.carbs_g ?? 0),
    fat_g: Number(f.fat_g ?? 0),
    serving_qty: Number(f.serving_qty ?? 1),
    serving_unit: String(f.serving_unit ?? 'serving'),
    serving_size_g: f.serving_size_g ? Number(f.serving_size_g) : null,
  }));
}
