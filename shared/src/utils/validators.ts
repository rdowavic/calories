import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  codeVerifier: z.string().optional(),
  redirectUri: z.string().optional(),
}).refine((data) => data.idToken || data.code, {
  message: 'Either idToken or code must be provided',
});

export const onboardingSchema = z.object({
  height_cm: z.number().min(50).max(300),
  current_weight_kg: z.number().min(20).max(500),
  goal_weight_kg: z.number().min(20).max(500),
  age: z.number().int().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
  daily_calorie_goal: z.number().int().min(800).max(10000).optional(),
  analytics_consent: z.boolean(),
});

export const userPreferencesSchema = z.object({
  unit_preference: z.enum(['metric', 'imperial']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications_enabled: z.boolean().optional(),
  lunch_nudge_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dinner_nudge_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
});

export const createFoodLogSchema = z.object({
  food_name: z.string().min(1).max(500),
  brand_name: z.string().max(255).optional(),
  external_food_id: z.string().optional(),
  food_source: z.enum(['fatsecret', 'usda', 'nutritionix', 'manual', 'recipe']),
  barcode: z.string().max(20).optional(),
  calories: z.number().min(0),
  protein_g: z.number().min(0).default(0),
  carbs_g: z.number().min(0).default(0),
  fat_g: z.number().min(0).default(0),
  fiber_g: z.number().min(0).default(0),
  sugar_g: z.number().min(0).default(0),
  sodium_mg: z.number().min(0).default(0),
  serving_qty: z.number().min(0.01),
  serving_unit: z.string().min(1).max(50),
  serving_size_g: z.number().min(0).optional(),
  meal_category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  input_method: z.enum(['barcode', 'photo', 'search', 'quick_add', 'recipe']),
  recipe_id: z.string().uuid().optional(),
  photo_url: z.string().url().optional(),
});

export const updateFoodLogSchema = createFoodLogSchema.partial();

export const createWeightEntrySchema = z.object({
  weight_kg: z.number().min(20).max(500),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  context_type: z.enum(['onboarding', 'food_logging', 'photo_narrowing', 'general']),
  metadata: z.record(z.unknown()).optional(),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  servings: z.number().min(0.25).max(100),
  ingredients: z.array(z.object({
    food_name: z.string().min(1).max(500),
    external_food_id: z.string().optional(),
    food_source: z.enum(['fatsecret', 'usda', 'nutritionix', 'manual', 'recipe']).optional(),
    calories: z.number().min(0),
    protein_g: z.number().min(0).default(0),
    carbs_g: z.number().min(0).default(0),
    fat_g: z.number().min(0).default(0),
    serving_qty: z.number().min(0.01),
    serving_unit: z.string().min(1).max(50),
    serving_size_g: z.number().min(0).optional(),
  })).min(1),
});

export const logRecipeSchema = z.object({
  servings: z.number().min(0.25),
  meal_category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const analyticsEventSchema = z.object({
  event_type: z.string().min(1),
  duration_ms: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});
