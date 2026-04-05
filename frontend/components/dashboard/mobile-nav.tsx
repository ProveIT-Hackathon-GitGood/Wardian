'use client';

import { X, LayoutGrid, BarChart3, Hospital, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/lib/dashboard-context';
import { useAuth } from '@/lib/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    selectedFloor,
    selectedWard,
    setSelectedFloor,
    setSelectedWard,
    floors,
  } = useDashboard();

  const currentFloor = floors.find((f) => f.id === selectedFloor);
  const wards = currentFloor?.wards || [];

  const navLinks = [
    { label: 'Ward Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Clinical Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-all duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Navigation Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col z-[51] lg:hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/wardian-logo.png" alt="Wardian" className="h-6 w-auto" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Hospital Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hospital className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Medical Institution</span>
            </div>
            <p className="text-sm font-semibold pl-6">{user?.hospital || 'Metropolitan General Hospital'}</p>
          </div>

          <div className="h-px bg-border/50" />

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">Navigation</div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-px bg-border/50" />

          {/* Ward Selector (Mobile only) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Floor & Ward Selection</span>
            </div>
            
            <div className="pl-6 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground px-1">Active Floor</label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id} className="text-xs">
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground px-1">Active Ward</label>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id} className="text-xs">
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Medical Staff'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight truncate">{user?.role || 'Clinician'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
