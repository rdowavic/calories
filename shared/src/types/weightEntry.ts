export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_date: string;
  note: string | null;
  created_at: string;
}

export interface CreateWeightEntryInput {
  weight_kg: number;
  logged_date: string;
  note?: string;
}

export interface WeightTrendData {
  entries: WeightEntry[];
  rolling_average: Array<{ date: string; weight_kg: number }>;
  trend_line: { slope: number; intercept: number };
}
