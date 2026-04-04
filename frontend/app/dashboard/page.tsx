'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { FloorMap } from '@/components/dashboard/floor-map';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { PatientDossier } from '@/components/dashboard/patient-dossier';
import { useDashboard } from '@/lib/dashboard-context';

export default function DashboardPage() {
  const { selectedPatient, setSelectedPatient } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 min-h-0">
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'mr-80' : ''}`}>
          <FloorMap />
        </main>
        
        {/* Alerts Sidebar */}
        <AlertsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Patient Dossier Modal */}
      {selectedPatient && (
        <PatientDossier
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
