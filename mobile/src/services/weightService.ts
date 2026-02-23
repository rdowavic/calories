import { api } from './api';
import { WeightEntry, CreateWeightEntryInput, WeightTrendData } from '@calories/shared';

export async function getWeightEntries(period: '30d' | '90d' | '1y' | 'all' = '30d'): Promise<WeightTrendData> {
  const { data } = await api.get('/weight', { params: { period } });
  // Server wraps in { success, data: { entries, rolling_average, trend_line } }
  return data?.data ?? data;
}

export async function createWeightEntry(input: CreateWeightEntryInput): Promise<WeightEntry> {
  const { data } = await api.post('/weight', input);
  // Server wraps in { success, data: WeightEntry }
  return data?.data ?? data;
}

export async function deleteWeightEntry(entryId: string): Promise<void> {
  await api.delete(`/weight/${entryId}`);
}
