import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  Projection,
  ProjectionStatus,
  User,
  calculateTDEE,
} from '@calories/shared';

/**
 * Energy density constants for the simplified Hall model (kcal/kg).
 */
const RHO_F = 9400; // Energy density of fat mass
const RHO_L = 1800; // Energy density of lean mass

/**
 * Adaptive thermogenesis factor: TDEE decreases by this many kcal
 * per kg of weight lost from starting weight.
 */
const ADAPTIVE_FACTOR = 15;

/**
 * Maximum projection horizon: 3 years in days.
 */
const MAX_PROJECTION_DAYS = 365 * 3;

/**
 * Default body fat percentage estimates when none is available.
 */
const DEFAULT_BODY_FAT: Record<string, number> = {
  male: 0.18,
  female: 0.25,
  other: 0.22,
};

/**
 * Estimates fat mass fraction for the Hall model energy partitioning.
 * Uses Forbes equation approximation: p = F / (F + 10.4)
 * where F = estimated fat mass in kg.
 */
function fatFraction(weightKg: number, bodyFatPct: number): number {
  const fatMass = weightKg * bodyFatPct;
  return fatMass / (fatMass + 10.4);
}

/**
 * Formats a Date to YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generates the weight loss/gain projection using a simplified Hall/NIH body
 * weight dynamics model.
 *
 * Steps:
 * 1. Calculate current TDEE from Mifflin-St Jeor
 * 2. Compute rolling 7-day average calorie intake
 * 3. Simulate forward day-by-day using Hall's two-compartment model
 * 4. Calculate today's impact on projected goal date
 */
export async function getProjection(userId: string): Promise<Projection> {
  // Fetch user profile
  const user: User | undefined = await db('users').where({ id: userId }).first();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  if (
    !user.current_weight_kg ||
    !user.goal_weight_kg ||
    !user.height_cm ||
    !user.age ||
    !user.gender ||
    !user.activity_level
  ) {
    throw Object.assign(
      new Error('User profile incomplete for projection calculation'),
      { status: 400 }
    );
  }

  const today = new Date();
  const todayStr = formatDate(today);

  // Fetch recent weight entries (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weightEntries = await db('weight_entries')
    .where({ user_id: userId })
    .where('logged_date', '>=', formatDate(sevenDaysAgo))
    .orderBy('logged_date', 'asc');

  const weight_history_7d = weightEntries.map(
    (e: { logged_date: string; weight_kg: number }) => ({
      date: e.logged_date,
      weight_kg: e.weight_kg,
    })
  );

  // Fetch 7-day calorie intake
  const calorieEntries = await db('food_logs')
    .where({ user_id: userId })
    .where('logged_date', '>=', formatDate(sevenDaysAgo))
    .where('logged_date', '<=', todayStr)
    .select('logged_date')
    .sum('calories as total_calories')
    .groupBy('logged_date')
    .orderBy('logged_date', 'asc');

  const calorie_history_7d = (calorieEntries as { logged_date: string; total_calories: string | number }[]).map(
    (e) => ({
      date: e.logged_date,
      total_calories: Number(e.total_calories),
    })
  );

  // Calculate rolling 7-day average calorie intake
  const totalCalories = calorie_history_7d.reduce(
    (sum: number, d: { total_calories: number }) => sum + d.total_calories,
    0
  );
  const daysWithData = calorie_history_7d.length || 1;
  const rolling_7day_avg_calories = Math.round(totalCalories / daysWithData);

  // Calculate current TDEE (ensure numeric types from DB)
  const currentTDEE = calculateTDEE(
    Number(user.current_weight_kg),
    Number(user.height_cm),
    Number(user.age),
    user.gender,
    user.activity_level
  );

  // Determine body fat percentage
  const bodyFatPct = DEFAULT_BODY_FAT[user.gender] ?? 0.22;

  // Simulate forward using simplified Hall model
  // Ensure numeric types (DB may return strings for decimal columns)
  const startWeight = Number(user.current_weight_kg);
  const goalWeight = Number(user.goal_weight_kg);
  const isLosing = goalWeight < startWeight;
  const dailyIntake = rolling_7day_avg_calories;

  let weight = startWeight;
  let projectedDays = 0;
  let goalReached = false;

  for (let day = 1; day <= MAX_PROJECTION_DAYS; day++) {
    const weightLost = startWeight - weight; // positive if losing
    const adaptiveTDEE = currentTDEE - ADAPTIVE_FACTOR * weightLost;

    const pF = fatFraction(weight, bodyFatPct);
    const effectiveDensity = RHO_F * pF + RHO_L * (1 - pF);

    const dailyWeightChange = (dailyIntake - adaptiveTDEE) / effectiveDensity;
    weight += dailyWeightChange;

    // Prevent weight from going below a safe minimum
    if (weight < 30) {
      weight = 30;
      projectedDays = day;
      break;
    }

    // Check if goal reached
    if (isLosing && weight <= goalWeight) {
      projectedDays = day;
      goalReached = true;
      break;
    } else if (!isLosing && weight >= goalWeight) {
      projectedDays = day;
      goalReached = true;
      break;
    }

    projectedDays = day;
  }

  // Calculate projected goal date
  const projectedDate = new Date(today);
  projectedDate.setDate(projectedDate.getDate() + projectedDays);

  // Calculate today's impact: simulate with vs without today's intake
  const todayCalories = calorie_history_7d.find(
    (d: { date: string }) => d.date === todayStr
  );
  let today_impact_days = 0;

  if (todayCalories) {
    // Simulate WITHOUT today's calories (as if today didn't happen)
    const avgWithoutToday =
      daysWithData > 1
        ? (totalCalories - todayCalories.total_calories) / (daysWithData - 1)
        : currentTDEE; // If only today's data, assume maintenance

    let weightAlt = startWeight;
    let daysAlt = 0;

    for (let day = 1; day <= MAX_PROJECTION_DAYS; day++) {
      const weightLost = startWeight - weightAlt;
      const adaptiveTDEE = currentTDEE - ADAPTIVE_FACTOR * weightLost;
      const pF = fatFraction(weightAlt, bodyFatPct);
      const effectiveDensity = RHO_F * pF + RHO_L * (1 - pF);
      const dailyWeightChange = (avgWithoutToday - adaptiveTDEE) / effectiveDensity;
      weightAlt += dailyWeightChange;

      if (weightAlt < 30) break;
      if (isLosing && weightAlt <= goalWeight) {
        daysAlt = day;
        break;
      } else if (!isLosing && weightAlt >= goalWeight) {
        daysAlt = day;
        break;
      }
      daysAlt = day;
    }

    today_impact_days = projectedDays - daysAlt;
  }

  // Determine status
  const dailyDeficit = currentTDEE - dailyIntake;
  const requiredDeficitForGoal = isLosing
    ? (startWeight - goalWeight) * 7700 / Math.max(projectedDays, 1) // rough kcal per kg
    : 0;

  let status: ProjectionStatus = 'on_track';
  if (isLosing) {
    if (dailyDeficit < requiredDeficitForGoal * 0.8) {
      status = 'behind';
    } else if (dailyDeficit > requiredDeficitForGoal * 1.2) {
      status = 'ahead';
    }
  } else {
    // Gaining
    const surplus = dailyIntake - currentTDEE;
    if (surplus < 100) {
      status = 'behind';
    } else if (surplus > 700) {
      status = 'ahead';
    }
  }

  const required_daily_deficit = isLosing
    ? Math.round(currentTDEE - dailyIntake)
    : Math.round(dailyIntake - currentTDEE);

  logger.debug(
    {
      userId,
      projectedDays,
      rolling_7day_avg_calories,
      currentTDEE,
      status,
    },
    'Projection calculated'
  );

  return {
    current_weight_kg: user.current_weight_kg,
    goal_weight_kg: goalWeight,
    projected_goal_date: formatDate(projectedDate),
    days_remaining: goalReached ? projectedDays : MAX_PROJECTION_DAYS,
    status,
    today_impact_days,
    rolling_7day_avg_calories,
    required_daily_deficit,
    weight_history_7d,
    calorie_history_7d,
  };
}
