import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import type { BedResponse, BedCreateRequest, BedUpdateRequest } from '../types';

export async function getBeds(): Promise<BedResponse[]> {
  return apiGet<BedResponse[]>('/api/v1/bed/', true);
}

export async function getBed(id: number): Promise<BedResponse> {
  return apiGet<BedResponse>(`/api/v1/bed/${id}`, true);
}

export async function createBed(data: BedCreateRequest): Promise<BedResponse> {
  return apiPost<BedResponse>('/api/v1/bed/', data, true);
}

export async function updateBed(id: number, data: BedUpdateRequest): Promise<BedResponse> {
  return apiPut<BedResponse>(`/api/v1/bed/${id}`, data, true);
}

export async function deleteBed(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/bed/${id}`, true);
}
