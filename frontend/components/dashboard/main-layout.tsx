'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 min-h-0">
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'mr-80' : ''}`}>
          {children}
        </main>
        
        <AlertsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
