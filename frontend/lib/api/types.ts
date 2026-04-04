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

export interface HospitalCreateRequest {
  name: string;
}

export interface HospitalUpdateRequest {
  name?: string;
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

export interface DepartmentUpdateRequest {
  name?: string;
  hospital_id?: number;
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

export interface WardUpdateRequest {
  department_id?: number;
  ward_number?: string;
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
  is_occupied?: boolean;
}

export interface BedUpdateRequest {
  ward_id?: number;
  bed_number?: string;
  is_occupied?: boolean;
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
  cnp: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact: string;
  attending_physician: string;
  blood_type: string;
  allergies: string | null;
  admission_date: string;
  ai_insight: string | null;
  diagnosis: string | null;
  performed_surgery: string | null;
  clinical_notes: string | null;
  sepsis_risk_score: number | null;
  is_active: boolean;
}

export interface PatientCreateRequest {
  bed_id?: number | null;
  name: string;
  age: number;
  gender: string;
  cnp: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact: string;
  attending_physician: string;
  blood_type: string;
  allergies?: string | null;
  admission_date: string;
  ai_insight?: string | null;
  diagnosis?: string | null;
  performed_surgery?: string | null;
  clinical_notes?: string | null;
  sepsis_risk_score?: number | null;
  is_active?: boolean;
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

// --- Alert ---

export type AlertType = 'CRITICAL' | 'WARNING' | 'INFO';

export interface AlertResponse {
  id: number;
  patient_id: number;
  bed_id: number;
  ward_id: number;
  type: AlertType;
  message: string | null;
  created_at: string;
  is_ready: boolean;
}

export interface AlertCreateRequest {
  patient_id: number;
  bed_id: number;
  ward_id: number;
  type: AlertType;
  message?: string | null;
}
