const BASE_URL = '';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wardian_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('wardian_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('wardian_token');
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      /* empty */
    }

    const errObj = body?.error as Record<string, unknown> | undefined;
    const details = errObj?.details as Array<{ field: string; message: string }> | undefined;

    let message = (errObj?.message as string) ?? (body?.detail as string) ?? res.statusText;
    if (res.status === 422 && Array.isArray(details) && details.length > 0) {
      message = details.map((d) => `${d.field}: ${d.message}`).join('\n');
    }

    const error: ApiError = { status: res.status, message, details };
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<T>(res);
}
