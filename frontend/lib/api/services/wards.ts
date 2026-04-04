import { apiGet } from '../client';
import type { WardResponse } from '../types';

export async function getWards(): Promise<WardResponse[]> {
  return apiGet<WardResponse[]>('/api/v1/ward/');
}
