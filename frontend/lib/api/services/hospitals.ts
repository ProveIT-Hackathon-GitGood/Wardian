import { apiGet } from '../client';
import type { HospitalResponse } from '../types';

export async function getHospitals(): Promise<HospitalResponse[]> {
  return apiGet<HospitalResponse[]>('/api/v1/hospital/');
}
