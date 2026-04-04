import { apiPost } from '../client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/v1/auth/login', data);
}

export async function register(data: RegisterRequest): Promise<unknown> {
  return apiPost<unknown>('/api/v1/auth/register', data, false);
}
