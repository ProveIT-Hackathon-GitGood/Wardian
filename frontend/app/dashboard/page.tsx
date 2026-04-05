'use client';

import { MainLayout } from '@/components/dashboard/main-layout';
import { FloorMap } from '@/components/dashboard/floor-map';
import { useDashboard } from '@/lib/dashboard-context';

export default function DashboardPage() {
  return (
    <MainLayout>
      <FloorMap />
    </MainLayout>
  );
}
