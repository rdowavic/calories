import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  User,
  OnboardingData,
  UserPreferences,
  calculateTDEE,
  calculateRecommendedCalories,
} from '@calories/shared';

export async function getUserById(id: string): Promise<User | undefined> {
  return db('users').where({ id }).first();
}

export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<User> {
  const [updated] = await db('users')
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');

  if (!updated) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return updated;
}

export async function completeOnboarding(
  id: string,
  data: OnboardingData
): Promise<{ user: User; tdee: number; recommended_calories: number }> {
  const tdee = calculateTDEE(
    data.current_weight_kg,
    data.height_cm,
    data.age,
    data.gender,
    data.activity_level
  );

  const recommended_calories = calculateRecommendedCalories(
    tdee,
    data.gender,
    data.goal_weight_kg,
    data.current_weight_kg
  );

  const daily_calorie_goal = data.daily_calorie_goal ?? recommended_calories;

  const user = await db.transaction(async (trx) => {
    const [updatedUser] = await trx('users')
      .where({ id })
      .update({
        height_cm: data.height_cm,
        current_weight_kg: data.current_weight_kg,
        goal_weight_kg: data.goal_weight_kg,
        age: data.age,
        gender: data.gender,
        activity_level: data.activity_level,
        daily_calorie_goal,
        tdee,
        analytics_consent: data.analytics_consent,
        onboarding_completed: true,
        updated_at: trx.fn.now(),
      })
      .returning('*');

    if (!updatedUser) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    await trx('weight_entries')
      .insert({
        user_id: id,
        weight_kg: data.current_weight_kg,
        logged_date: today,
      })
      .onConflict(['user_id', 'logged_date'])
      .merge({ weight_kg: data.current_weight_kg });

    logger.info(
      { userId: id, tdee, daily_calorie_goal },
      'User completed onboarding'
    );

    return updatedUser;
  });

  return { user, tdee, recommended_calories };
}

export async function updatePreferences(
  id: string,
  prefs: UserPreferences
): Promise<User> {
  const [updated] = await db('users')
    .where({ id })
    .update({ ...prefs, updated_at: db.fn.now() })
    .returning('*');

  if (!updated) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  logger.debug({ userId: id }, 'User preferences updated');
  return updated;
}
