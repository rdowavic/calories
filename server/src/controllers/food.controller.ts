import { Response } from 'express';
import { FoodSource } from '@calories/shared';
import { AuthRequest } from '../middleware/auth';
import * as foodService from '../services/food.service';

export async function searchFoods(req: AuthRequest, res: Response) {
  const { q, query, page = '0', source } = req.query as Record<string, string>;
  const searchQuery = q || query;
  if (!searchQuery) {
    return res.status(400).json({ success: false, error: 'Query parameter is required' });
  }
  const results = await foodService.searchFoods(
    searchQuery,
    parseInt(page),
    source ? (source as FoodSource) : undefined
  );
  res.json({ success: true, data: { results, total: results.length } });
}

export async function getFoodByBarcode(req: AuthRequest, res: Response) {
  const { code } = req.params;
  const result = await foodService.getFoodByBarcode(code);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Food not found for barcode' });
  }
  res.json({ success: true, data: result });
}

export async function getFoodDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { source } = req.query as Record<string, string>;
  const result = await foodService.getFoodDetail(id, source as FoodSource);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Food not found' });
  }
  res.json({ success: true, data: result });
}

export async function getFrequentFoods(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const results = await foodService.getFrequentFoods(userId);
  res.json({ success: true, data: results });
}
