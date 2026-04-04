import { apiGet, apiPost } from '../client';
import type { DepartmentResponse, DepartmentCreateRequest } from '../types';

export async function getDepartments(): Promise<DepartmentResponse[]> {
  return apiGet<DepartmentResponse[]>('/api/v1/department/');
}

export async function createDepartment(data: DepartmentCreateRequest): Promise<DepartmentResponse> {
  return apiPost<DepartmentResponse>('/api/v1/department/', data, true);
}
