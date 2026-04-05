import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BarChart3,
  CalendarDays,
  LogOut,
  RotateCcw,
  Search,
  User,
  X,
} from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';
import { useAuth } from '@/lib/auth-context';
import { useAppDate } from '@/lib/date-context';
import Link from 'next/link';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currentDate, setCurrentDate, resetToToday, isCustomDate } = useAppDate();
  const {
    selectedFloor,
    selectedWard,
    setSelectedFloor,
    setSelectedWard,
    setSearchQuery,
    setHighlightedBed,
    patients,
    unreadAlertCount,
    floors,
  } = useDashboard();

  const [localSearch, setLocalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentFloor = floors.find((f) => f.id === selectedFloor);
  const wards = currentFloor?.wards || [];

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(localSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSelect = (patientName: string, bedNumber: string, patientId?: string) => {
    // If we have a patientId, navigate to their profile
    if (patientId) {
      router.push(`/dashboard/patient/${patientId.replace('patient-', '')}`);
      setLocalSearch('');
      setShowSearchResults(false);
      return;
    }

    // Fallback/Original behavior: Scroll to bed in main layout
    setSearchQuery(patientName);
    setLocalSearch('');
    setShowSearchResults(false);
    setHighlightedBed(bedNumber);
    
    const bedElement = document.getElementById(`bed-${bedNumber}`);
    if (bedElement) {
      bedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedBed(null);
    }, 5000);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-12 items-center gap-3 px-3 lg:px-4">
        {/* Logo */}
        <Link href="/dashboard">
          <img src="/wardian-logo.png" alt="Wardian" className="h-[1.7rem] w-auto" />
        </Link>

        <div className="h-4 w-px bg-border" />

        {/* Floor & Ward Selection */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm font-semibold truncate max-w-[150px]">{user?.hospital || 'Hospital'}</span>
            <span className="text-muted-foreground w-px h-4 bg-border" />
          </div>

          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
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

          <Select value={selectedWard} onValueChange={setSelectedWard}>
            <SelectTrigger className="h-7 min-w-[80px] w-auto gap-2 text-xs">
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

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search patients..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredPatients.length > 0) {
                handlePatientSelect(filteredPatients[0].name, filteredPatients[0].bedNumber, filteredPatients[0].id);
              }
            }}
            className="h-7 pl-8 pr-7 text-xs"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
                setHighlightedBed(null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}

          {showSearchResults && localSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-md overflow-hidden z-50">
              {filteredPatients.length > 0 ? (
                <ul className="max-h-48 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <li key={patient.id}>
                      <button
                        onClick={() => handlePatientSelect(patient.name, patient.bedNumber, patient.id)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-accent text-left transition-colors"
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium ${
                          patient.status === 'critical' ? 'bg-critical/10 text-critical' :
                          patient.status === 'warning' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {patient.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{patient.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Bed {patient.bedNumber} - {patient.diagnosis.split(' - ')[0]}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hidden sm:flex">
              <BarChart3 className="w-4 h-4" />
              <span className="sr-only">Analytics</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-7 w-7 p-0 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[9px]"
              >
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </Badge>
            )}
            <span className="sr-only">Alerts</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <User className="w-4 h-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-[200px]">
              <DropdownMenuLabel className="py-1.5">
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{user?.name || 'User'}</span>
                  <span className="text-[10px] font-normal text-muted-foreground capitalize">{user?.role || ''}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-1">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  defaultMonth={currentDate}
                  className="scale-90 origin-top"
                />
                {isCustomDate && (
                  <div className="px-3 pb-2 pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={resetToToday}>
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Reset to Today
                    </Button>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-xs">
                <Link href="/dashboard/analytics" className="cursor-pointer">
                  <BarChart3 className="w-3.5 h-3.5 mr-2" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { logout(); router.push('/'); }}
                className="text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
