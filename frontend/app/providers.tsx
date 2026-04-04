'use client';

import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import { DateProvider } from '@/lib/date-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DateProvider>
        {children}
        <Toaster richColors position="top-right" />
      </DateProvider>
    </AuthProvider>
  );
}
