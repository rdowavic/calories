import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notification.service';

export async function registerToken(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { token, deviceId } = req.body;
  await notificationService.registerToken(userId, token, deviceId);
  res.json({ success: true, data: null });
}

export async function unregisterToken(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { token } = req.body;
  await notificationService.unregisterToken(userId, token);
  res.json({ success: true, data: null });
}
