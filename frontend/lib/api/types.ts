/**
 * Backend response types — these mirror the Pydantic schemas
 * returned by the FastAPI backend (snake_case, integer IDs).
 */

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  hospital_id: number;
  department_id: number;
  role: 'doctor' | 'nurse';
  employee_code: string;
}

// --- Hospital ---

export interface HospitalResponse {
  id: number;
  name: string;
}

// --- Department ---

export interface DepartmentResponse {
  id: number;
  name: string;
  hospital_id: number;
}

export interface DepartmentCreateRequest {
  name: string;
  hospital_id: number;
}

// --- Ward ---

export interface WardResponse {
  id: number;
  department_id: number;
  ward_number: string;
}

export interface WardCreateRequest {
  department_id: number;
  ward_number: string;
}

// --- Bed ---

export interface BedResponse {
  id: number;
  ward_id: number;
  bed_number: string;
  is_occupied: boolean;
}

export interface BedCreateRequest {
  ward_id: number;
  bed_number: string;
}

// --- Medical Staff ---

export interface MedicalStaffResponse {
  id: number;
  email: string;
  full_name: string;
  department_id: number;
  hospital_id: number;
  role: 'doctor' | 'nurse';
}

// --- Patient ---

export interface PatientResponse {
  id: number;
  bed_id: number | null;
  name: string;
  age: number;
  gender: string;
  is_active: boolean;
}

export interface PatientCreateRequest {
  bed_id?: number | null;
  name: string;
  age: number;
  gender: string;
}

// --- Patient Vitals ---

export interface PatientVitalResponse {
  id: number;
  patient_id: number;
  timestamp: string | null;
  heart_rate: number;
  lactate: number;
  ai_risk_score: number | null;
}

export interface PatientVitalCreateRequest {
  patient_id: number;
  heart_rate: number;
  lactate: number;
  ai_risk_score?: number | null;
}
