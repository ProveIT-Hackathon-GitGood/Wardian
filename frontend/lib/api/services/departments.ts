import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import type { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '../types';

export async function getDepartments(): Promise<DepartmentResponse[]> {
  return apiGet<DepartmentResponse[]>('/api/v1/department/');
}

export async function getDepartment(id: number): Promise<DepartmentResponse> {
  return apiGet<DepartmentResponse>(`/api/v1/department/${id}`, true);
}

export async function createDepartment(data: DepartmentCreateRequest): Promise<DepartmentResponse> {
  return apiPost<DepartmentResponse>('/api/v1/department/', data, true);
}

export async function updateDepartment(id: number, data: DepartmentUpdateRequest): Promise<DepartmentResponse> {
  return apiPut<DepartmentResponse>(`/api/v1/department/${id}`, data, true);
}

export async function deleteDepartment(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/department/${id}`, true);
}
