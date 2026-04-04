import { DashboardProvider } from '@/lib/dashboard-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      {children}
    </DashboardProvider>
  );
}
