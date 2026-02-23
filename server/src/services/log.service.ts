import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  FoodLog,
  CreateFoodLogInput,
  DailyLogResponse,
  DailyTotals,
} from '@calories/shared';
import * as analyticsService from './analytics.service';

/**
 * Creates a food log entry.
 * Also increments use_count in favorite_foods if the food is favorited,
 * and records an analytics event if the user has analytics consent.
 */
export async function createLog(
  userId: string,
  data: CreateFoodLogInput
): Promise<FoodLog> {
  const [log] = await db('food_logs')
    .insert({
      user_id: userId,
      food_name: data.food_name,
      brand_name: data.brand_name ?? null,
      external_food_id: data.external_food_id ?? null,
      food_source: data.food_source,
      barcode: data.barcode ?? null,
      calories: data.calories,
      protein_g: data.protein_g ?? 0,
      carbs_g: data.carbs_g ?? 0,
      fat_g: data.fat_g ?? 0,
      fiber_g: data.fiber_g ?? 0,
      sugar_g: data.sugar_g ?? 0,
      sodium_mg: data.sodium_mg ?? 0,
      serving_qty: data.serving_qty,
      serving_unit: data.serving_unit,
      serving_size_g: data.serving_size_g ?? null,
      meal_category: data.meal_category,
      logged_date: data.logged_date,
      logged_at: db.fn.now(),
      input_method: data.input_method,
      recipe_id: data.recipe_id ?? null,
      photo_url: data.photo_url ?? null,
    })
    .returning('*');

  // Increment use_count on favorite_foods if this food is favorited
  if (data.external_food_id) {
    await db('favorite_foods')
      .where({
        user_id: userId,
        external_food_id: data.external_food_id,
        food_source: data.food_source,
      })
      .increment('use_count', 1)
      .catch((err: unknown) => {
        // Non-critical: log and continue
        logger.debug({ err, userId }, 'No matching favorite to increment');
      });
  }

  // Record analytics event if user has consent
  try {
    const user = await db('users').where({ id: userId }).select('analytics_consent').first();
    if (user?.analytics_consent) {
      await analyticsService.trackEvent(userId, 'food_log_completed', undefined, {
        food_source: data.food_source,
        input_method: data.input_method,
        meal_category: data.meal_category,
      });
    }
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to record analytics for food log');
  }

  logger.info({ userId, logId: log.id, food: data.food_name }, 'Food log created');
  return log;
}

/**
 * Computes totals from an array of food logs.
 */
function computeTotals(logs: FoodLog[]): DailyTotals {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories ?? 0),
      protein_g: acc.protein_g + Number(log.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(log.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(log.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

/**
 * Gets all food logs for a specific date along with computed totals and goal info.
 */
export async function getLogsByDate(
  userId: string,
  date: string
): Promise<DailyLogResponse> {
  const logs: FoodLog[] = await db('food_logs')
    .where({ user_id: userId, logged_date: date })
    .orderBy('logged_at', 'asc');

  const totals = computeTotals(logs);

  const user = await db('users')
    .where({ id: userId })
    .select('daily_calorie_goal')
    .first();

  const dailyGoal = user?.daily_calorie_goal ?? 2000;

  return {
    logs,
    totals,
    goal: {
      daily_calories: dailyGoal,
      remaining: dailyGoal - totals.calories,
    },
  };
}

/**
 * Gets food logs within a date range, grouped by day with totals.
 */
export async function getLogsByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; logs: FoodLog[]; totals: DailyTotals }>> {
  const logs: FoodLog[] = await db('food_logs')
    .where({ user_id: userId })
    .whereBetween('logged_date', [startDate, endDate])
    .orderBy('logged_date', 'asc')
    .orderBy('logged_at', 'asc');

  // Group logs by date
  const grouped = new Map<string, FoodLog[]>();
  for (const log of logs) {
    const dateKey = log.logged_date;
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(log);
  }

  return Array.from(grouped.entries()).map(([date, dayLogs]) => ({
    date,
    logs: dayLogs,
    totals: computeTotals(dayLogs),
  }));
}

/**
 * Updates an existing food log.
 */
export async function updateLog(
  userId: string,
  logId: string,
  data: Partial<CreateFoodLogInput>
): Promise<FoodLog> {
  const [updated] = await db('food_logs')
    .where({ id: logId, user_id: userId })
    .update({
      ...data,
      updated_at: db.fn.now(),
    })
    .returning('*');

  if (!updated) {
    throw Object.assign(new Error('Food log not found'), { status: 404 });
  }

  logger.debug({ userId, logId }, 'Food log updated');
  return updated;
}

/**
 * Deletes a food log.
 */
export async function deleteLog(userId: string, logId: string): Promise<void> {
  const deleted = await db('food_logs')
    .where({ id: logId, user_id: userId })
    .del();

  if (!deleted) {
    throw Object.assign(new Error('Food log not found'), { status: 404 });
  }

  logger.debug({ userId, logId }, 'Food log deleted');
}

/**
 * Adds a food log's food data to the user's favorites.
 */
export async function addToFavorites(userId: string, logId: string): Promise<void> {
  const log: FoodLog | undefined = await db('food_logs')
    .where({ id: logId, user_id: userId })
    .first();

  if (!log) {
    throw Object.assign(new Error('Food log not found'), { status: 404 });
  }

  await db('favorite_foods')
    .insert({
      user_id: userId,
      food_name: log.food_name,
      brand_name: log.brand_name,
      external_food_id: log.external_food_id,
      food_source: log.food_source,
      calories: log.calories,
      protein_g: log.protein_g,
      carbs_g: log.carbs_g,
      fat_g: log.fat_g,
      serving_qty: log.serving_qty,
      serving_unit: log.serving_unit,
      serving_size_g: log.serving_size_g,
      use_count: 1,
    })
    .onConflict(['user_id', 'external_food_id', 'food_source'])
    .merge({
      use_count: db.raw('favorite_foods.use_count + 1'),
      updated_at: db.fn.now(),
    });

  logger.info({ userId, logId, food: log.food_name }, 'Food added to favorites');
}
