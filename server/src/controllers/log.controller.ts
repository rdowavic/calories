import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as logService from '../services/log.service';

export async function getLogsByDate(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { date } = req.query as Record<string, string>;
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date parameter is required' });
  }
  const result = await logService.getLogsByDate(userId, date);
  res.json({ success: true, data: result });
}

export async function getLogsByRange(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { startDate, endDate } = req.query as Record<string, string>;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
  }
  const result = await logService.getLogsByRange(userId, startDate, endDate);
  res.json({ success: true, data: result });
}

export async function createLog(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const log = await logService.createLog(userId, req.body);
  res.status(201).json({ success: true, data: log });
}

export async function updateLog(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const log = await logService.updateLog(userId, id, req.body);
  res.json({ success: true, data: log });
}

export async function deleteLog(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  await logService.deleteLog(userId, id);
  res.json({ success: true, data: null });
}

export async function addToFavorites(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  await logService.addToFavorites(userId, id);
  res.json({ success: true, data: null });
}
