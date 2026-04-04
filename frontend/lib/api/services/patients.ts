import { apiGet, apiPost, apiPatch } from '../client';
import type { PatientResponse, PatientCreateRequest } from '../types';

export async function getPatients(): Promise<PatientResponse[]> {
  return apiGet<PatientResponse[]>('/api/v1/patient/', true);
}

export async function getPatient(id: number): Promise<PatientResponse> {
  return apiGet<PatientResponse>(`/api/v1/patient/${id}`, true);
}

export async function createPatient(data: PatientCreateRequest): Promise<PatientResponse> {
  return apiPost<PatientResponse>('/api/v1/patient/', data, true);
}

export async function updatePatient(id: number, data: Partial<PatientCreateRequest>): Promise<PatientResponse> {
  return apiPatch<PatientResponse>(`/api/v1/patient/${id}`, data, true);
}
