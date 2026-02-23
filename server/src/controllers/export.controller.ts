import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as exportService from '../services/export.service';

export async function exportCsv(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { type = 'all', startDate, endDate } = req.query as Record<string, string>;

  // Default to last 30 days if no date range provided
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="calories-export-${new Date().toISOString().split('T')[0]}.csv"`);

  let csvStream;
  if (type === 'food_logs') {
    csvStream = await exportService.exportFoodLogs(userId, start, end);
  } else if (type === 'weight') {
    csvStream = await exportService.exportWeightEntries(userId, start, end);
  } else {
    csvStream = await exportService.exportAll(userId, start, end);
  }

  csvStream.pipe(res);
}
