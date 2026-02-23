export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type UnitPreference = 'metric' | 'imperial';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  google_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  age: number | null;
  gender: Gender | null;
  activity_level: ActivityLevel | null;
  daily_calorie_goal: number | null;
  tdee: number | null;
  unit_preference: UnitPreference;
  theme: ThemePreference;
  onboarding_completed: boolean;
  analytics_consent: boolean;
  notifications_enabled: boolean;
  lunch_nudge_time: string;
  dinner_nudge_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  daily_calorie_goal?: number;
  analytics_consent: boolean;
}

export interface UserPreferences {
  unit_preference?: UnitPreference;
  theme?: ThemePreference;
  notifications_enabled?: boolean;
  lunch_nudge_time?: string;
  dinner_nudge_time?: string;
  timezone?: string;
}
