'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi, setAuthToken, clearAuthToken, type ApiError } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'nurse' | 'admin';
  hospital: string;
  hospitalId: number;
  departmentId: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'nurse';
  hospitalId: number;
  hospitalName: string;
  departmentId: number;
  employeeCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildUserFromToken(token: string, extra?: Partial<User>): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return {
    id: String(payload.id ?? ''),
    email: (payload.email as string) ?? '',
    name: extra?.name ?? (payload.email as string) ?? '',
    role: (payload.role as User['role']) ?? 'doctor',
    hospital: extra?.hospital ?? '',
    hospitalId: extra?.hospitalId ?? 0,
    departmentId: extra?.departmentId ?? 0,
  };
}

const TOKEN_KEY = 'wardian_token';
const USER_KEY = 'wardian_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        const payload = decodeJwtPayload(token);
        if (payload && typeof payload.expiry === 'number' && payload.expiry * 1000 > Date.now()) {
          setUser(parsed);
          setAuthToken(token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await authApi.login({ email, password });
    setAuthToken(res.token);
    localStorage.setItem(TOKEN_KEY, res.token);

    const u = buildUserFromToken(res.token) ?? {
      id: '',
      email,
      name: email,
      role: 'doctor' as const,
      hospital: '',
      hospitalId: 0,
      departmentId: 0,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    await authApi.register({
      full_name: data.name,
      email: data.email,
      password: data.password,
      hospital_id: data.hospitalId,
      department_id: data.departmentId,
      role: data.role,
      employee_code: data.employeeCode,
    });

    const loginRes = await authApi.login({ email: data.email, password: data.password });
    setAuthToken(loginRes.token);
    localStorage.setItem(TOKEN_KEY, loginRes.token);

    const u: User = {
      id: '',
      email: data.email,
      name: data.name,
      role: data.role,
      hospital: data.hospitalName,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
    };
    const fromToken = buildUserFromToken(loginRes.token, u);
    const finalUser = fromToken ?? u;

    localStorage.setItem(USER_KEY, JSON.stringify(finalUser));
    setUser(finalUser);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
