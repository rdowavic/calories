import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analytics.service';

export async function getOverview(req: AuthRequest, res: Response) {
  const { period = '30d' } = req.query as Record<string, string>;
  const data = await analyticsService.getAdminOverview(period as '7d' | '30d' | '90d');
  res.json({ success: true, data });
}

export async function getTimeToLog(req: AuthRequest, res: Response) {
  const { period = '30d', groupBy = 'day' } = req.query as Record<string, string>;
  const data = await analyticsService.getTimeToLogData(period as '7d' | '30d' | '90d', groupBy as 'day' | 'week');
  res.json({ success: true, data });
}

export async function getProjectionUsage(req: AuthRequest, res: Response) {
  const { period = '30d' } = req.query as Record<string, string>;
  const data = await analyticsService.getProjectionUsage(period as '7d' | '30d' | '90d');
  res.json({ success: true, data });
}

export async function getEngagement(req: AuthRequest, res: Response) {
  const { period = '30d' } = req.query as Record<string, string>;
  const data = await analyticsService.getEngagementData(period as '7d' | '30d' | '90d');
  res.json({ success: true, data });
}
