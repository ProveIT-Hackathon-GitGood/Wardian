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
    <div className="min-h-screen bg-background">
      <DashboardHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-80' : ''}`}>
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
