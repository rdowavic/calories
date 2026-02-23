import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as weightService from '../services/weight.service';

export async function getWeightEntries(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { period = '30d' } = req.query as Record<string, string>;
  const result = await weightService.getWeightEntries(userId, period as '30d' | '90d' | '1y' | 'all');
  res.json({ success: true, data: result });
}

export async function createWeightEntry(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const entry = await weightService.createOrUpdateEntry(userId, req.body);
  res.status(201).json({ success: true, data: entry });
}

export async function deleteWeightEntry(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  await weightService.deleteEntry(userId, id);
  res.json({ success: true, data: null });
}
