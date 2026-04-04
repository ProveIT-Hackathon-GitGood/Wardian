import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import type { WardResponse, WardCreateRequest, WardUpdateRequest } from '../types';

export async function getWards(): Promise<WardResponse[]> {
  return apiGet<WardResponse[]>('/api/v1/ward/', true);
}

export async function getWard(id: number): Promise<WardResponse> {
  return apiGet<WardResponse>(`/api/v1/ward/${id}`, true);
}

export async function createWard(data: WardCreateRequest): Promise<WardResponse> {
  return apiPost<WardResponse>('/api/v1/ward/', data, true);
}

export async function updateWard(id: number, data: WardUpdateRequest): Promise<WardResponse> {
  return apiPut<WardResponse>(`/api/v1/ward/${id}`, data, true);
}

export async function deleteWard(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/ward/${id}`, true);
}
