import { api } from './api';
import { Projection } from '@calories/shared';

export async function getProjection(): Promise<Projection> {
  const { data } = await api.get('/projections');
  return data?.data ?? data;
}
