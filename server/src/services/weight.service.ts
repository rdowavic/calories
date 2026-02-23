import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  WeightEntry,
  CreateWeightEntryInput,
  WeightTrendData,
} from '@calories/shared';

type WeightPeriod = '30d' | '90d' | '1y' | 'all';

/**
 * Calculates the start date for a given period.
 */
function getStartDate(period: WeightPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '30d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case '90d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'all':
      return null;
  }
}

/**
 * Computes a rolling 7-day average for a series of weight entries.
 * Uses a sliding window approach; entries are expected to be sorted by date ascending.
 */
function computeRollingAverage(
  entries: WeightEntry[]
): Array<{ date: string; weight_kg: number }> {
  if (entries.length === 0) return [];

  const result: Array<{ date: string; weight_kg: number }> = [];

  for (let i = 0; i < entries.length; i++) {
    const currentDate = new Date(entries[i].logged_date);
    const windowStart = new Date(currentDate);
    windowStart.setDate(windowStart.getDate() - 6); // 7-day window including current

    const windowEntries = entries.filter((e) => {
      const d = new Date(e.logged_date);
      return d >= windowStart && d <= currentDate;
    });

    const avg =
      windowEntries.reduce((sum, e) => sum + e.weight_kg, 0) / windowEntries.length;

    result.push({
      date: entries[i].logged_date,
      weight_kg: Math.round(avg * 100) / 100,
    });
  }

  return result;
}

/**
 * Computes a simple linear regression trend line (slope + intercept)
 * from weight entries. X values are days since first entry.
 */
function computeTrendLine(
  entries: WeightEntry[]
): { slope: number; intercept: number } {
  if (entries.length < 2) {
    return { slope: 0, intercept: entries[0]?.weight_kg ?? 0 };
  }

  const firstDate = new Date(entries[0].logged_date).getTime();
  const n = entries.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const entry of entries) {
    const x = (new Date(entry.logged_date).getTime() - firstDate) / (1000 * 60 * 60 * 24); // days
    const y = entry.weight_kg;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: Math.round(slope * 10000) / 10000, // kg per day, 4 decimal places
    intercept: Math.round(intercept * 100) / 100,
  };
}

/**
 * Gets weight entries for the specified period with computed trend data.
 */
export async function getWeightEntries(
  userId: string,
  period: WeightPeriod
): Promise<WeightTrendData> {
  const startDate = getStartDate(period);

  let query = db('weight_entries')
    .where({ user_id: userId })
    .orderBy('logged_date', 'asc');

  if (startDate) {
    query = query.where('logged_date', '>=', startDate.toISOString().split('T')[0]);
  }

  const entries: WeightEntry[] = await query;

  const rolling_average = computeRollingAverage(entries);
  const trend_line = computeTrendLine(entries);

  return {
    entries,
    rolling_average,
    trend_line,
  };
}

/**
 * Creates or updates a weight entry (one per day).
 * Also updates the user's current_weight_kg.
 */
export async function createOrUpdateEntry(
  userId: string,
  data: CreateWeightEntryInput
): Promise<WeightEntry> {
  const [entry] = await db('weight_entries')
    .insert({
      user_id: userId,
      weight_kg: data.weight_kg,
      logged_date: data.logged_date,
      note: data.note ?? null,
    })
    .onConflict(['user_id', 'logged_date'])
    .merge({
      weight_kg: data.weight_kg,
      note: data.note ?? null,
    })
    .returning('*');

  // Update user's current weight if this is today's entry or the most recent
  const today = new Date().toISOString().split('T')[0];
  if (data.logged_date >= today) {
    await db('users')
      .where({ id: userId })
      .update({
        current_weight_kg: data.weight_kg,
        updated_at: db.fn.now(),
      });
  }

  logger.info(
    { userId, date: data.logged_date, weight: data.weight_kg },
    'Weight entry saved'
  );

  return entry;
}

/**
 * Deletes a weight entry.
 */
export async function deleteEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const deleted = await db('weight_entries')
    .where({ id: entryId, user_id: userId })
    .del();

  if (!deleted) {
    throw Object.assign(new Error('Weight entry not found'), { status: 404 });
  }

  logger.debug({ userId, entryId }, 'Weight entry deleted');
}
