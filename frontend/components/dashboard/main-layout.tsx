import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile detection for initial state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardHeader 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
      />
      
      <div className="flex flex-1 min-h-0 relative">
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen && !isMobile ? 'mr-80' : ''}`}>
          {children}
        </main>
        
        <AlertsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
