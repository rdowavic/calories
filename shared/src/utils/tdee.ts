import { Gender, ActivityLevel } from '../types/user';
import { getActivityMultiplier } from '../constants/activityLevels';

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor Equation.
 * This is considered the most accurate for most people.
 *
 * Men:    BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
 * Women:  BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  // For 'other', use average of male/female
  return Math.round(base - 78);
}

/**
 * Calculates Total Daily Energy Expenditure.
 * TDEE = BMR * activity multiplier
 */
export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender,
  activity_level: ActivityLevel
): number {
  const bmr = calculateBMR(weight_kg, height_cm, age, gender);
  const multiplier = getActivityMultiplier(activity_level);
  return Math.round(bmr * multiplier);
}

/**
 * Calculates a recommended daily calorie target for weight loss.
 * Uses a moderate deficit of 500 cal/day (~0.45 kg/week loss).
 * Never goes below 1200 (women) or 1500 (men) for safety.
 */
export function calculateRecommendedCalories(
  tdee: number,
  gender: Gender,
  goal_weight_kg: number,
  current_weight_kg: number
): number {
  const isGaining = goal_weight_kg > current_weight_kg;
  const deficit = isGaining ? -500 : 500; // surplus for gaining
  const target = tdee - deficit;

  const minimums: Record<Gender, number> = {
    male: 1500,
    female: 1200,
    other: 1350,
  };

  return Math.max(target, minimums[gender]);
}

export type WeightLossSpeed = 'moderate' | 'fast' | 'aggressive';

/**
 * Calculates daily calorie target based on desired weight loss speed.
 *
 * - moderate:   ~0.5 kg/week (500 cal/day deficit)
 * - fast:       ~0.75 kg/week (750 cal/day deficit)
 * - aggressive: ~1 kg/week (1000 cal/day deficit) — max safe rate
 *
 * Always respects safe minimums (1200 women / 1500 men).
 * Returns the daily calorie target and projected weeks to goal.
 */
export function calculateGoalCalories(
  tdee: number,
  gender: Gender,
  current_weight_kg: number,
  goal_weight_kg: number,
  speed: WeightLossSpeed = 'aggressive'
): { daily_calories: number; weekly_loss_kg: number; weeks_to_goal: number } {
  const minimums: Record<Gender, number> = {
    male: 1500,
    female: 1200,
    other: 1350,
  };

  const deficits: Record<WeightLossSpeed, number> = {
    moderate: 500,
    fast: 750,
    aggressive: 1000,
  };

  const deficit = deficits[speed];
  const isLosing = goal_weight_kg < current_weight_kg;
  const raw = isLosing ? tdee - deficit : tdee + deficit;
  const daily_calories = Math.max(Math.round(raw), minimums[gender]);

  // Actual deficit after clamping to minimum
  const actual_deficit = isLosing ? Math.max(tdee - daily_calories, 0) : Math.max(daily_calories - tdee, 0);
  // ~7700 kcal ≈ 1 kg of body fat
  const weekly_loss_kg = Math.round((actual_deficit * 7) / 7700 * 10) / 10;
  const weight_to_change = Math.abs(current_weight_kg - goal_weight_kg);
  const weeks_to_goal = weekly_loss_kg > 0 ? Math.ceil(weight_to_change / weekly_loss_kg) : 0;

  return { daily_calories, weekly_loss_kg, weeks_to_goal };
}
