import axios from 'axios';
import { logger } from '../config/logger';
import { FoodDetail, FoodServing } from '@calories/shared';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'User-Agent': 'Calories-App/1.0 (contact@calories.app)',
  },
});

/**
 * Extracts calories from Open Food Facts nutriments, with multiple fallbacks:
 * 1. energy-kcal (direct kcal value)
 * 2. energy (kJ) → convert to kcal by dividing by 4.184
 * 3. Compute from macros: protein×4 + carbs×4 + fat×9
 */
function extractCalories(
  nutriments: Record<string, unknown>,
  suffix: string,
  protein: number,
  carbs: number,
  fat: number
): number {
  // Try energy-kcal first
  const kcal = nutriments[`energy-kcal${suffix}`];
  if (kcal != null && Number(kcal) > 0) {
    return Math.round(Number(kcal));
  }

  // Try energy (usually in kJ) and convert
  const energy = nutriments[`energy${suffix}`];
  if (energy != null && Number(energy) > 0) {
    const unit = String(nutriments['energy_unit'] ?? 'kJ').toLowerCase();
    if (unit === 'kcal') {
      return Math.round(Number(energy));
    }
    // kJ to kcal
    return Math.round(Number(energy) / 4.184);
  }

  // Compute from macros as last resort
  const computed = protein * 4 + carbs * 4 + fat * 9;
  if (computed > 0) {
    return Math.round(computed);
  }

  return 0;
}

/**
 * Looks up a food product by barcode using Open Food Facts.
 * This is a free, open-source database with excellent international coverage.
 * No API key required.
 */
export async function findByBarcode(barcode: string): Promise<FoodDetail | null> {
  try {
    const response = await client.get(`/product/${barcode}`, {
      params: {
        fields: 'product_name,brands,nutriments,serving_quantity,serving_quantity_unit,serving_size,image_url',
      },
    });

    const data = response.data;
    if (data.status !== 1 || !data.product) {
      logger.debug({ barcode }, 'Open Food Facts: product not found');
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments ?? {};

    // Determine if per-serving data is available by checking any serving-level nutriment
    const hasServing =
      nutriments['energy-kcal_serving'] != null ||
      nutriments['energy_serving'] != null ||
      nutriments['carbohydrates_serving'] != null ||
      nutriments['proteins_serving'] != null ||
      nutriments['fat_serving'] != null;

    const suffix = hasServing ? '_serving' : '_100g';

    const protein = Number(nutriments[`proteins${suffix}`] ?? 0);
    const carbs = Number(nutriments[`carbohydrates${suffix}`] ?? 0);
    const fat = Number(nutriments[`fat${suffix}`] ?? 0);
    const fiber = Number(nutriments[`fiber${suffix}`] ?? 0);
    const sugar = Number(nutriments[`sugars${suffix}`] ?? 0);
    const sodium = Number(nutriments[`sodium${suffix}`] ?? 0) * 1000; // convert g to mg

    const calories = extractCalories(nutriments, suffix, protein, carbs, fat);

    const servingSize = product.serving_size || (hasServing ? `${product.serving_quantity ?? 1} ${product.serving_quantity_unit ?? 'serving'}` : '100g');

    const defaultServing: FoodServing = {
      serving_id: 'off-default',
      serving_description: servingSize,
      serving_qty: 1,
      serving_unit: servingSize,
      metric_serving_amount: hasServing ? Number(product.serving_quantity ?? 100) : 100,
      metric_serving_unit: hasServing ? (product.serving_quantity_unit ?? 'g') : 'g',
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    };

    const servingWeight = hasServing ? Number(product.serving_quantity ?? 100) : 100;

    const foodDetail: FoodDetail = {
      external_food_id: `off-${barcode}`,
      food_name: product.product_name || 'Unknown Product',
      brand_name: product.brands || null,
      food_source: 'manual', // Use 'manual' since 'openfoodfacts' isn't in the FoodSource enum
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      fiber_g: fiber,
      sugar_g: sugar,
      sodium_mg: sodium,
      serving_qty: 1,
      serving_unit: servingSize,
      serving_size_g: servingWeight,
      servings: [defaultServing],
    };

    logger.info({ barcode, foodName: foodDetail.food_name, calories }, 'Open Food Facts: product found');
    return foodDetail;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    logger.warn({ error, barcode }, 'Open Food Facts lookup failed');
    return null;
  }
}
