export type FoodSource = 'fatsecret' | 'usda' | 'nutritionix' | 'manual' | 'recipe';
export type InputMethod = 'barcode' | 'photo' | 'search' | 'quick_add' | 'recipe';
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodSearchResult {
  external_food_id: string;
  food_source: FoodSource;
  food_name: string;
  brand_name: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_qty: number;
  serving_unit: string;
  serving_size_g: number | null;
}

export interface FoodDetail extends FoodSearchResult {
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  servings: FoodServing[];
}

export interface FoodServing {
  serving_id: string;
  serving_description: string;
  serving_qty: number;
  serving_unit: string;
  metric_serving_amount: number | null;
  metric_serving_unit: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface BarcodeResult {
  food: FoodDetail | null;
  source: string;
}

export interface PhotoCandidate {
  name: string;
  confidence: number;
  clarifai_id: string;
}

export interface PhotoRecognitionResult {
  candidates: PhotoCandidate[];
  session_id: string;
}
