import { api } from './api';
import { User, OnboardingData, UserPreferences } from '@calories/shared';

export async function getMe(): Promise<User> {
  const { data } = await api.get('/users/me');
  return data.user;
}

export async function updateProfile(updates: Partial<User>): Promise<User> {
  const { data } = await api.put('/users/me', updates);
  return data.user;
}

export async function completeOnboarding(input: OnboardingData): Promise<{ user: User; tdee: number; recommended_calories: number }> {
  const { data } = await api.put('/users/me/onboarding', input);
  return data;
}

export async function updatePreferences(prefs: UserPreferences): Promise<User> {
  const { data } = await api.put('/users/me/preferences', prefs);
  return data.user;
}
