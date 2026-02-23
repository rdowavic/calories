import { api } from './api';
import { FoodSearchResult, FoodDetail, BarcodeResult } from '@calories/shared';

export async function searchFoods(query: string, page = 0): Promise<{ results: FoodSearchResult[]; total: number }> {
  const { data } = await api.get('/foods/search', { params: { q: query, page } });
  // Server wraps in { success, data: { results, total } }
  return data?.data ?? data;
}

export async function getFoodByBarcode(barcode: string): Promise<BarcodeResult> {
  const { data } = await api.get(`/foods/barcode/${barcode}`);
  // Server returns { success, data: FoodDetail } — wrap into BarcodeResult shape
  const food = data?.data ?? data;
  return { food, source: food?.food_source ?? 'fatsecret' };
}

export async function getFoodDetail(foodId: string, source: string): Promise<FoodDetail> {
  const { data } = await api.get(`/foods/${foodId}`, { params: { source } });
  return data?.data ?? data;
}

export async function getFrequentFoods(): Promise<FoodSearchResult[]> {
  try {
    const { data } = await api.get('/foods/frequent');
    const inner = data?.data ?? data;
    return inner?.foods ?? [];
  } catch {
    return [];
  }
}
