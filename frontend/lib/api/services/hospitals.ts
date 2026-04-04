import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import type { HospitalResponse, HospitalCreateRequest, HospitalUpdateRequest } from '../types';

export async function getHospitals(): Promise<HospitalResponse[]> {
  return apiGet<HospitalResponse[]>('/api/v1/hospital/');
}

export async function getHospital(id: number): Promise<HospitalResponse> {
  return apiGet<HospitalResponse>(`/api/v1/hospital/${id}`, true);
}

export async function createHospital(data: HospitalCreateRequest): Promise<HospitalResponse> {
  return apiPost<HospitalResponse>('/api/v1/hospital/', data, true);
}

export async function updateHospital(id: number, data: HospitalUpdateRequest): Promise<HospitalResponse> {
  return apiPut<HospitalResponse>(`/api/v1/hospital/${id}`, data, true);
}

export async function deleteHospital(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/hospital/${id}`, true);
}
