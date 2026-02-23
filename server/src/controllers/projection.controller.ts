import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as projectionService from '../services/projection.service';

export async function getProjection(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const projection = await projectionService.getProjection(userId);
  res.json({ success: true, data: projection });
}
