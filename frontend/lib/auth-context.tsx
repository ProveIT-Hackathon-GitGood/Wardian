'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'nurse' | 'admin';
  hospital: string;
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'nurse';
  hospital: string;
  employeeId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock login - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate successful login
    setUser({
      id: '1',
      name: 'Dr. Elena Radu',
      email,
      role: 'doctor',
      hospital: 'Central University Hospital',
      employeeId: 'DOC-2024-001',
    });
    
    return true;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    // Mock registration - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setUser({
      id: '1',
      name: data.name,
      email: data.email,
      role: data.role,
      hospital: data.hospital,
      employeeId: data.employeeId,
    });
    
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
