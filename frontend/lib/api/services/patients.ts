import { apiGet } from '../client';
import type { PatientResponse } from '../types';

export async function getPatients(): Promise<PatientResponse[]> {
  return apiGet<PatientResponse[]>('/api/v1/patient/');
}
