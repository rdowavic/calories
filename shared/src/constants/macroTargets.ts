export const DEFAULT_MACRO_SPLIT = {
  protein_pct: 0.30,
  carbs_pct: 0.40,
  fat_pct: 0.30,
};

export function calculateMacroTargets(dailyCalories: number, split = DEFAULT_MACRO_SPLIT) {
  return {
    protein_g: Math.round((dailyCalories * split.protein_pct) / 4),
    carbs_g: Math.round((dailyCalories * split.carbs_pct) / 4),
    fat_g: Math.round((dailyCalories * split.fat_pct) / 9),
  };
}
