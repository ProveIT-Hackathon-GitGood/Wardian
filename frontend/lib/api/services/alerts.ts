import { apiPost } from '../client';
import type { AlertCreateRequest } from '../types';

export async function createAlert(data: AlertCreateRequest): Promise<unknown> {
  return apiPost<unknown>('/api/v1/alert', data);
}
