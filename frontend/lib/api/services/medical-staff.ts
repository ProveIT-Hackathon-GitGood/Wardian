import { apiGet } from '../client';
import type { MedicalStaffResponse } from '../types';

export async function getMedicalStaff(): Promise<MedicalStaffResponse[]> {
  return apiGet<MedicalStaffResponse[]>('/api/v1/medical-staff/', true);
}
