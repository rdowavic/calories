import { FoodSource } from './food';

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  servings: number;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  food_name: string;
  external_food_id: string | null;
  food_source: FoodSource | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_qty: number;
  serving_unit: string;
  serving_size_g: number | null;
  sort_order: number;
  created_at: string;
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  servings: number;
  ingredients: Array<{
    food_name: string;
    external_food_id?: string;
    food_source?: FoodSource;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    serving_qty: number;
    serving_unit: string;
    serving_size_g?: number;
  }>;
}

export interface LogRecipeInput {
  servings: number;
  meal_category: string;
  logged_date: string;
}
