import { FoodSource, InputMethod, MealCategory } from './food';

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  brand_name: string | null;
  food_source: FoodSource;
  external_food_id: string | null;
  barcode: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_qty: number;
  serving_unit: string;
  serving_size_g: number | null;
  meal_category: MealCategory;
  logged_date: string;
  logged_at: string;
  input_method: InputMethod;
  recipe_id: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodLogInput {
  food_name: string;
  brand_name?: string;
  external_food_id?: string;
  food_source: FoodSource;
  barcode?: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  serving_qty: number;
  serving_unit: string;
  serving_size_g?: number;
  meal_category: MealCategory;
  logged_date: string;
  input_method: InputMethod;
  recipe_id?: string;
  photo_url?: string;
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DailyLogResponse {
  logs: FoodLog[];
  totals: DailyTotals;
  goal: {
    daily_calories: number;
    remaining: number;
  };
}
