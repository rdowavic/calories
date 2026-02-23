import { MealCategory } from '../types/food';

export const MEAL_CATEGORIES: { key: MealCategory; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { key: 'snack', label: 'Snack', icon: 'cafe-outline' },
];

export const MEAL_TIME_RANGES: Record<MealCategory, { start: number; end: number }> = {
  breakfast: { start: 5, end: 11 },
  lunch: { start: 11, end: 15 },
  dinner: { start: 15, end: 21 },
  snack: { start: 0, end: 24 },
};

export function getCurrentMealCategory(): MealCategory {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'snack';
}
