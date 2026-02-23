import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  AnalyticsEventType,
  AdminOverview,
  TimeToLogData,
  ProjectionUsage,
  EngagementData,
} from '@calories/shared';

type AnalyticsPeriod = '7d' | '30d' | '90d';
type GroupBy = 'day' | 'week';

/**
 * Calculates the start date for a given analytics period.
 */
function getPeriodStartDate(period: AnalyticsPeriod): string {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start.toISOString().split('T')[0];
}

/**
 * Tracks an analytics event for a user.
 */
export async function trackEvent(
  userId: string,
  eventType: AnalyticsEventType,
  durationMs?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db('analytics_events').insert({
    user_id: userId,
    event_type: eventType,
    duration_ms: durationMs ?? null,
    metadata: metadata ? JSON.stringify(metadata) : '{}',
  });

  logger.debug({ userId, eventType }, 'Analytics event tracked');
}

/**
 * Gets an admin overview of platform metrics for the given period.
 */
export async function getAdminOverview(
  period: AnalyticsPeriod
): Promise<AdminOverview> {
  const startDate = getPeriodStartDate(period);

  // Total users
  const [{ count: totalUsers }] = await db('users').count('id as count');

  // Active users in period (users who logged food)
  const [{ count: activeUsers }] = await db('food_logs')
    .where('logged_date', '>=', startDate)
    .countDistinct('user_id as count');

  // Total logs in period
  const [{ count: totalLogs }] = await db('food_logs')
    .where('logged_date', '>=', startDate)
    .count('id as count');

  // Average meals per user per day
  const activeUserCount = Number(activeUsers) || 1;
  const totalLogCount = Number(totalLogs) || 0;
  const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const avgMealsPerUserPerDay = totalLogCount / (activeUserCount * daysInPeriod);

  // Average time to log (from food_log_completed events)
  const [avgTimeResult] = await db('analytics_events')
    .where('event_type', 'food_log_completed')
    .where('created_at', '>=', startDate)
    .whereNotNull('duration_ms')
    .avg('duration_ms as avg_ms');

  return {
    total_users: Number(totalUsers),
    active_users_period: Number(activeUsers),
    avg_meals_per_user_per_day: Math.round(avgMealsPerUserPerDay * 100) / 100,
    avg_time_to_log_ms: Math.round(Number(avgTimeResult?.avg_ms ?? 0)),
    total_logs_period: Number(totalLogs),
  };
}

/**
 * Gets time-to-log analytics data grouped by day or week.
 * Returns avg, median, p95, and count for each time bucket.
 */
export async function getTimeToLogData(
  period: AnalyticsPeriod,
  groupBy: GroupBy
): Promise<TimeToLogData[]> {
  const startDate = getPeriodStartDate(period);

  const dateExpr =
    groupBy === 'week'
      ? db.raw("date_trunc('week', created_at)::date")
      : db.raw("created_at::date");

  const rows = await db('analytics_events')
    .select(db.raw(`${groupBy === 'week' ? "date_trunc('week', created_at)::date" : "created_at::date"} as date`))
    .avg('duration_ms as avg_ms')
    .select(
      db.raw('percentile_cont(0.5) within group (order by duration_ms) as median_ms')
    )
    .select(
      db.raw('percentile_cont(0.95) within group (order by duration_ms) as p95_ms')
    )
    .count('id as count')
    .where('event_type', 'food_log_completed')
    .where('created_at', '>=', startDate)
    .whereNotNull('duration_ms')
    .groupByRaw(
      groupBy === 'week'
        ? "date_trunc('week', created_at)::date"
        : 'created_at::date'
    )
    .orderBy('date', 'asc');

  return rows.map((row: Record<string, unknown>) => ({
    date: String(row.date),
    avg_ms: Math.round(Number(row.avg_ms ?? 0)),
    median_ms: Math.round(Number(row.median_ms ?? 0)),
    p95_ms: Math.round(Number(row.p95_ms ?? 0)),
    count: Number(row.count ?? 0),
  }));
}

/**
 * Calculates the percentage of active users who viewed projections weekly.
 */
export async function getProjectionUsage(
  period: AnalyticsPeriod
): Promise<ProjectionUsage> {
  const startDate = getPeriodStartDate(period);

  // Total active users in period
  const [{ count: activeUsers }] = await db('food_logs')
    .where('logged_date', '>=', startDate)
    .countDistinct('user_id as count');

  const activeUserCount = Number(activeUsers) || 1;

  // Users who viewed projections
  const [{ count: projectionViewers }] = await db('analytics_events')
    .where('event_type', 'projection_viewed')
    .where('created_at', '>=', startDate)
    .countDistinct('user_id as count');

  // Total projection views
  const [{ count: totalViews }] = await db('analytics_events')
    .where('event_type', 'projection_viewed')
    .where('created_at', '>=', startDate)
    .count('id as count');

  // Users checking weekly (at least once per week)
  const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const weeksInPeriod = Math.max(1, Math.floor(daysInPeriod / 7));

  // Users who viewed projections in at least half the weeks
  const weeklyCheckers = await db('analytics_events')
    .select('user_id')
    .select(
      db.raw("count(distinct date_trunc('week', created_at)::date) as weeks_active")
    )
    .where('event_type', 'projection_viewed')
    .where('created_at', '>=', startDate)
    .groupBy('user_id')
    .having(
      db.raw("count(distinct date_trunc('week', created_at)::date)"),
      '>=',
      Math.ceil(weeksInPeriod * 0.5)
    );

  // Users checking daily (at least 5 of 7 days per week on average)
  const dailyCheckers = await db('analytics_events')
    .select('user_id')
    .select(
      db.raw("count(distinct created_at::date) as days_active")
    )
    .where('event_type', 'projection_viewed')
    .where('created_at', '>=', startDate)
    .groupBy('user_id')
    .having(
      db.raw("count(distinct created_at::date)"),
      '>=',
      Math.ceil(daysInPeriod * 0.7)
    );

  return {
    users_checking_weekly_pct:
      Math.round((weeklyCheckers.length / activeUserCount) * 10000) / 100,
    users_checking_daily_pct:
      Math.round((dailyCheckers.length / activeUserCount) * 10000) / 100,
    total_projection_views: Number(totalViews),
  };
}

/**
 * Gets daily engagement data: active users and meals logged trend.
 */
export async function getEngagementData(
  period: AnalyticsPeriod
): Promise<EngagementData[]> {
  const startDate = getPeriodStartDate(period);

  const rows = await db('food_logs')
    .select('logged_date as date')
    .countDistinct('user_id as active_users')
    .count('id as meals_logged')
    .where('logged_date', '>=', startDate)
    .groupBy('logged_date')
    .orderBy('logged_date', 'asc');

  return rows.map((row: Record<string, unknown>) => {
    const activeUsers = Number(row.active_users ?? 0);
    const mealsLogged = Number(row.meals_logged ?? 0);

    return {
      date: String(row.date),
      active_users: activeUsers,
      meals_logged: mealsLogged,
      avg_meals_per_user:
        activeUsers > 0
          ? Math.round((mealsLogged / activeUsers) * 100) / 100
          : 0,
    };
  });
}
