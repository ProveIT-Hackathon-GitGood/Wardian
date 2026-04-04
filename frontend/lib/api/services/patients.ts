import { apiGet, apiPost, apiPatch, apiUpload } from '../client';
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

export async function addPatientHistory(id: number, data: any): Promise<any> {
  return apiPost<any>(`/api/v1/patient/${id}/history`, data, true);
}

export async function uploadPatientFile(file: File): Promise<{ filename: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<{ filename: string; url: string }>('/api/v1/patient/upload', formData, true);
}

