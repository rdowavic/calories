import { api } from './api';
import { CreateFoodLogInput, DailyLogResponse, FoodLog } from '@calories/shared';

export async function getLogsByDate(date: string): Promise<DailyLogResponse> {
  const { data } = await api.get('/logs', { params: { date } });
  // Server wraps in { success, data: { logs, totals, goal } }
  return data?.data ?? data;
}

export async function getLogsByRange(start: string, end: string) {
  const { data } = await api.get('/logs/range', { params: { start, end } });
  return data?.data ?? data;
}

export async function createLog(input: CreateFoodLogInput): Promise<FoodLog> {
  const { data } = await api.post('/logs', input);
  // Server returns { success, data: FoodLog }
  return data?.data ?? data;
}

export async function updateLog(logId: string, updates: Partial<CreateFoodLogInput>): Promise<FoodLog> {
  const { data } = await api.put(`/logs/${logId}`, updates);
  return data?.data ?? data;
}

export async function deleteLog(logId: string): Promise<void> {
  await api.delete(`/logs/${logId}`);
}

export async function addToFavorites(logId: string) {
  const { data } = await api.post(`/logs/${logId}/favorite`);
  return data.favorite;
}
