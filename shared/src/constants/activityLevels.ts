import { ActivityLevel } from '../types/user';

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job', multiplier: 1.2 },
  { key: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week', multiplier: 1.375 },
  { key: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week', multiplier: 1.55 },
  { key: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week', multiplier: 1.725 },
  { key: 'extra_active', label: 'Extra Active', description: 'Very hard exercise, physical job', multiplier: 1.9 },
];

export function getActivityMultiplier(level: ActivityLevel): number {
  const found = ACTIVITY_LEVELS.find(a => a.key === level);
  return found ? found.multiplier : 1.2;
}
