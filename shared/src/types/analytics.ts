export type AnalyticsEventType =
  | 'food_log_started'
  | 'food_log_completed'
  | 'barcode_scanned'
  | 'photo_captured'
  | 'search_performed'
  | 'projection_viewed'
  | 'weekly_summary_viewed'
  | 'onboarding_started'
  | 'onboarding_completed';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: AnalyticsEventType;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateAnalyticsEventInput {
  event_type: AnalyticsEventType;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

export interface AdminOverview {
  total_users: number;
  active_users_period: number;
  avg_meals_per_user_per_day: number;
  avg_time_to_log_ms: number;
  total_logs_period: number;
}

export interface TimeToLogData {
  date: string;
  avg_ms: number;
  median_ms: number;
  p95_ms: number;
  count: number;
}

export interface ProjectionUsage {
  users_checking_weekly_pct: number;
  users_checking_daily_pct: number;
  total_projection_views: number;
}

export interface EngagementData {
  date: string;
  active_users: number;
  meals_logged: number;
  avg_meals_per_user: number;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start_date: string;
  avg_daily_calories: number | null;
  avg_daily_protein_g: number | null;
  avg_daily_carbs_g: number | null;
  avg_daily_fat_g: number | null;
  total_logs: number;
  days_logged: number;
  weight_start_kg: number | null;
  weight_end_kg: number | null;
  weight_change_kg: number | null;
  projected_goal_date: string | null;
  projection_status: string | null;
  created_at: string;
}
