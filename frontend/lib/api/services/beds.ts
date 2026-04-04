import { apiGet } from '../client';
import type { BedResponse } from '../types';

export async function getBeds(): Promise<BedResponse[]> {
  return apiGet<BedResponse[]>('/api/v1/bed/');
}
