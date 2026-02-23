export type ProjectionStatus = 'on_track' | 'behind' | 'ahead';

export interface Projection {
  current_weight_kg: number;
  goal_weight_kg: number;
  projected_goal_date: string;
  days_remaining: number;
  status: ProjectionStatus;
  today_impact_days: number;
  rolling_7day_avg_calories: number;
  required_daily_deficit: number;
  weight_history_7d: Array<{ date: string; weight_kg: number }>;
  calorie_history_7d: Array<{ date: string; total_calories: number }>;
}
