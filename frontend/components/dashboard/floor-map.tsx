'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutGrid,
  Map,
  Plus,
  Trash2,
  MoreVertical,
  UserPlus,
  UserMinus,
  ChevronDown,
  Bed,
  User,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BLOOD_TYPE_OPTIONS, type Patient } from '@/lib/mock-data';
import { patientsApi, bedsApi } from '@/lib/api';
import type { PatientCreateRequest } from '@/lib/api/types';
import { toast } from 'sonner';
import type { ApiError } from '@/lib/api';

type StatusFilter = 'all' | 'stable' | 'warning' | 'critical';
type ViewMode = 'grid' | 'floor';

export function FloorMap() {
  const {
    patients,
    highlightedBed,
    floors,
    selectedFloor,
    selectedWard,
    setSelectedWard,
    addWard,
    deleteWard,
    addBed,
    deleteBed,
    getCurrentWardBeds,
    addPatient,
    addUnassignedPatient,
    removePatient,
    assignPatientToBed,
    unassignPatientFromBed,
    getUnassignedPatients,
    getBedBackendId,
    getPatientBackendId,
  } = useDashboard();
  
  const router = useRouter();
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('floor');
  const [showAddWardDialog, setShowAddWardDialog] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteBedConfirm, setShowDeleteBedConfirm] = useState<string | null>(null);
  const [showAddPatientDialog, setShowAddPatientDialog] = useState<string | null>(null);
  const [showAssignPatientDialog, setShowAssignPatientDialog] = useState<string | null>(null);
  const [showRemovePatientConfirm, setShowRemovePatientConfirm] = useState<string | null>(null);
  
  // New patient form state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'M' | 'F'>('M');
  const [newPatientDiagnosis, setNewPatientDiagnosis] = useState('');
  const [newPatientCnp, setNewPatientCnp] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmergencyName, setNewPatientEmergencyName] = useState('');
  const [newPatientEmergencyPhone, setNewPatientEmergencyPhone] = useState('');
  const [newPatientBloodType, setNewPatientBloodType] = useState('');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');
  const [newPatientAttending, setNewPatientAttending] = useState('');
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  const currentFloor = floors.find((f) => f.id === selectedFloor);
  const currentWard = currentFloor?.wards.find((w) => w.id === selectedWard);
  const wardBeds = getCurrentWardBeds();
  const unassignedPatients = getUnassignedPatients();

  // Get patients for current ward
  const wardPatients = wardBeds
    .filter((bed) => bed.patient)
    .map((bed) => bed.patient as Patient);

  // Count patients by status
  const statusCounts = {
    all: wardPatients.length,
    stable: wardPatients.filter((p) => p.status === 'stable').length,
    warning: wardPatients.filter((p) => p.status === 'warning').length,
    critical: wardPatients.filter((p) => p.status === 'critical').length,
  };

  // Filter patients by status
  const filteredPatients =
    statusFilter === 'all'
      ? wardPatients
      : wardPatients.filter((p) => p.status === statusFilter);

  const handleAddWard = async () => {
    if (newWardName.trim()) {
      await addWard(selectedFloor, newWardName.trim());
      setNewWardName('');
      setShowAddWardDialog(false);
    }
  };

  const handleDeleteWard = (wardId: string) => {
    deleteWard(selectedFloor, wardId);
    setShowDeleteConfirm(null);
    const remainingWards = currentFloor?.wards.filter((w) => w.id !== wardId);
    if (remainingWards && remainingWards.length > 0) {
      setSelectedWard(remainingWards[0].id);
    }
  };

  const handleAddBed = async () => {
    try {
      const nextBedNum = wardBeds.length + 1;
      const bedNumber = String(nextBedNum).padStart(2, '0');
      const wardBackendId = parseInt(selectedWard.replace('ward-', ''), 10);
      const res = await bedsApi.createBed({
        ward_id: wardBackendId,
        bed_number: bedNumber,
      });
      addBed(selectedWard, res.id);
      toast.success(`Bed ${bedNumber} created`);
    } catch (err: unknown) {
      addBed(selectedWard);
      const msg = (err as ApiError)?.message || 'Backend sync failed, bed added locally';
      toast.warning(msg);
    }
  };

  const handleAssignPatientToBed = async (patientId: string, bedId: string) => {
    const patientBackendId = getPatientBackendId(patientId);
    const bedBackendId = getBedBackendId(bedId);

    assignPatientToBed(patientId, bedId);

    if (patientBackendId && bedBackendId) {
      try {
        await patientsApi.updatePatient(patientBackendId, { bed_id: bedBackendId });
      } catch {
        toast.warning('Assigned locally but backend sync failed');
      }
    }
  };

  const handleUnassignPatientFromBed = async (bedId: string) => {
    const bed = wardBeds.find(b => b.id === bedId);
    const patientBackendId = bed?.patient ? getPatientBackendId(bed.patient.id) : undefined;

    unassignPatientFromBed(bedId);

    if (patientBackendId) {
      try {
        await patientsApi.updatePatient(patientBackendId, { bed_id: null });
      } catch {
        toast.warning('Unassigned locally but backend sync failed');
      }
    }
  };

  const resetPatientForm = () => {
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientGender('M');
    setNewPatientDiagnosis('');
    setNewPatientCnp('');
    setNewPatientPhone('');
    setNewPatientEmergencyName('');
    setNewPatientEmergencyPhone('');
    setNewPatientBloodType('');
    setNewPatientAllergies('');
    setNewPatientAttending('');
  };

  const buildPatientData = (bedNumber: string): Omit<Patient, 'id' | 'initials'> => ({
    name: newPatientName.trim(),
    age: parseInt(newPatientAge, 10),
    gender: newPatientGender,
    diagnosis: newPatientDiagnosis.trim(),
    status: 'stable',
    sepsisRiskScore: Math.floor(Math.random() * 30),
    bedNumber,
    admissionDate: new Date().toISOString().split('T')[0],
    attendingPhysician: newPatientAttending.trim() || 'Unassigned',
    vitals: {
      heartRate: 72 + Math.floor(Math.random() * 20),
      bloodPressure: '120/80',
      temperature: 36.5 + Math.random() * 0.5,
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
    aiInsight: 'Patient recently admitted. Monitoring vitals.',
    medicalHistory: [],
    performedSurgery: '',
    clinicalObservations: '',
    cnp: newPatientCnp.trim() || undefined,
    phoneNumber: newPatientPhone.trim() || undefined,
    emergencyContactName: newPatientEmergencyName.trim() || undefined,
    emergencyContactPhone: newPatientEmergencyPhone.trim() || undefined,
    bloodType: newPatientBloodType || undefined,
    allergies: newPatientAllergies.trim() || undefined,
  });

  const handleAddPatient = async (target: string) => {
    if (!newPatientName.trim() || !newPatientAge || !newPatientDiagnosis.trim()) return;

    setIsSubmittingPatient(true);

    const bed = target !== 'standalone' ? wardBeds.find(b => b.id === target) : undefined;
    const bedNumber = bed?.bedNumber || '--';

    const apiPayload: PatientCreateRequest = {
      name: newPatientName.trim(),
      age: parseInt(newPatientAge, 10),
      gender: newPatientGender,
      cnp: newPatientCnp.trim() || '0000000000000',
      phone_number: newPatientPhone.trim() || '-',
      emergency_contact_name: newPatientEmergencyName.trim() || '-',
      emergency_contact: newPatientEmergencyPhone.trim() || '-',
      attending_physician: newPatientAttending.trim() || 'Unassigned',
      blood_type: newPatientBloodType || 'O+',
      allergies: newPatientAllergies.trim() || null,
      admission_date: new Date().toISOString(),
      diagnosis: newPatientDiagnosis.trim(),
    };

    try {
      const created = await patientsApi.createPatient(apiPayload);
      const localData = { ...buildPatientData(bedNumber), backendId: created.id };

      if (target === 'standalone') {
        addUnassignedPatient(localData);
      } else {
        addPatient(localData, target);
      }

      toast.success('Patient added successfully');
      resetPatientForm();
      setShowAddPatientDialog(null);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to add patient';
      toast.error(msg);
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Ward Header - Compact */}
      <div className="mb-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {currentFloor?.name || 'Floor'}
            </h2>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{wardPatients.length} patients</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddWardDialog(true)}
            className="h-7 text-xs gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Ward
          </Button>
        </div>

        {/* Ward Tabs - Inline */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto">
          {currentFloor?.wards.map((ward) => (
            <div key={ward.id} className="flex items-center h-7">
              <button
                onClick={() => setSelectedWard(ward.id)}
                className={cn(
                  'px-3 h-full text-xs font-medium rounded-l transition-colors',
                  selectedWard === ward.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {ward.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'px-1.5 h-full rounded-r border-l transition-colors flex items-center justify-center',
                      selectedWard === ward.id
                        ? 'bg-primary text-primary-foreground border-primary-foreground/20'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    )}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(ward.id)}
                    className="text-destructive focus:text-destructive text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete Ward
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatCard label="Beds" value={wardBeds.length} />
        <StatCard label="Occupied" value={wardPatients.length} />
        <StatCard label="Critical" value={statusCounts.critical} variant="critical" />
        <StatCard label="Warning" value={statusCounts.warning} variant="warning" />
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {(['all', 'stable', 'warning', 'critical'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded transition-colors',
                statusFilter === status
                  ? status === 'all' ? 'bg-foreground text-background'
                    : status === 'stable' ? 'bg-success text-white'
                    : status === 'warning' ? 'bg-warning text-white'
                    : 'bg-critical text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1 opacity-70">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddPatientDialog('standalone')}
            className="h-7 text-xs gap-1.5"
          >
            <UserPlus className="w-3 h-3" />
            Add Patient
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddBed}
            className="h-7 text-xs gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Bed
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-7">
              <TabsTrigger value="floor" className="text-xs px-2 h-6">
                <Map className="w-3 h-3 mr-1" />
                Floor
              </TabsTrigger>
              <TabsTrigger value="grid" className="text-xs px-2 h-6">
                <LayoutGrid className="w-3 h-3 mr-1" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Unassigned Patients Alert */}
      {unassignedPatients.length > 0 && (
        <div className="mb-4 p-2 bg-warning/10 border border-warning/30 rounded text-xs">
          <span className="font-medium text-warning">{unassignedPatients.length} unassigned patient(s)</span>
          <span className="text-muted-foreground ml-2">- Click an empty bed to assign</span>
        </div>
      )}

      {/* View Content */}
      {viewMode === 'floor' ? (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <WardFloorPlan
            beds={wardBeds}
            patients={filteredPatients}
            allPatients={wardPatients}
            highlightedBed={highlightedBed}
            onSelectPatient={(p) => router.push(`/dashboard/patient/${p.id}`)}
            statusFilter={statusFilter}
            wardName={currentWard?.name || 'Ward'}
            onDeleteBed={(bedId) => setShowDeleteBedConfirm(bedId)}
            onAssignPatient={(bedId) => setShowAssignPatientDialog(bedId)}
            onUnassignPatient={(bedId) => handleUnassignPatientFromBed(bedId)}
            onRemovePatient={(patientId) => setShowRemovePatientConfirm(patientId)}
            hasUnassignedPatients={unassignedPatients.length > 0}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {wardBeds.map((bed) => (
            <BedGridCard
              key={bed.id}
              bedId={bed.id}
              bedNumber={bed.bedNumber}
              patient={bed.patient}
              isHighlighted={highlightedBed === bed.bedNumber}
              isFiltered={
                statusFilter === 'all' ||
                bed.patient?.status === statusFilter
              }
              onClick={() => bed.patient && router.push(`/dashboard/patient/${bed.patient.id}`)}
              onDelete={() => setShowDeleteBedConfirm(bed.id)}
              onAssignPatient={() => setShowAssignPatientDialog(bed.id)}
              onUnassignPatient={() => handleUnassignPatientFromBed(bed.id)}
              onRemovePatient={() => bed.patient && setShowRemovePatientConfirm(bed.patient.id)}
              hasUnassignedPatients={unassignedPatients.length > 0}
            />
          ))}
        </div>
      )}

      {/* Legend - Compact */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <LegendItem color="success" label="Stable" />
          <LegendItem color="warning" label="Warning" />
          <LegendItem color="critical" label="Critical" />
          <LegendItem color="empty" label="Empty" />
        </div>
      </div>

      {/* Add Ward Dialog */}
      <Dialog open={showAddWardDialog} onOpenChange={setShowAddWardDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Add New Ward</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new ward in {currentFloor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="ward-name" className="text-xs font-medium">
              Ward Name
            </Label>
            <Input
              id="ward-name"
              value={newWardName}
              onChange={(e) => setNewWardName(e.target.value)}
              placeholder="e.g., Ward G"
              className="mt-1.5 h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddWard()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddWardDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddWard} disabled={!newWardName.trim()}>
              Add Ward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ward Confirmation */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Ward</DialogTitle>
            <DialogDescription className="text-xs">
              This will remove all beds. Patients will be moved to unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => showDeleteConfirm && handleDeleteWard(showDeleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bed Confirmation */}
      <Dialog open={!!showDeleteBedConfirm} onOpenChange={() => setShowDeleteBedConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Bed</DialogTitle>
            <DialogDescription className="text-xs">
              {wardBeds.find(b => b.id === showDeleteBedConfirm)?.patient
                ? 'The patient will be moved to unassigned.'
                : 'This bed will be permanently removed.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteBedConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (showDeleteBedConfirm) {
                  deleteBed(showDeleteBedConfirm);
                  setShowDeleteBedConfirm(null);
                }
              }}
            >
              Delete Bed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog (comprehensive form - standalone or per-bed) */}
      <Dialog open={!!showAddPatientDialog} onOpenChange={() => { resetPatientForm(); setShowAddPatientDialog(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-3 border-b border-border">
            <DialogTitle className="text-base">Add New Patient</DialogTitle>
            <DialogDescription className="text-xs">
              {showAddPatientDialog === 'standalone'
                ? 'Patient will be added to the unassigned pool'
                : `Assigning to Bed ${wardBeds.find(b => b.id === showAddPatientDialog)?.bedNumber}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-5 py-4 space-y-5">
              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Personal Information</legend>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="patient-name" className="text-xs">Full Name *</Label>
                      <Input id="patient-name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Ion Popescu" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="patient-cnp" className="text-xs">CNP</Label>
                      <Input id="patient-cnp" value={newPatientCnp} onChange={(e) => setNewPatientCnp(e.target.value)} placeholder="1234567890123" className="mt-1 h-8 text-sm" maxLength={13} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="patient-age" className="text-xs">Age *</Label>
                      <Input id="patient-age" type="number" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)} placeholder="45" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="patient-gender" className="text-xs">Gender *</Label>
                      <Select value={newPatientGender} onValueChange={(v) => setNewPatientGender(v as 'M' | 'F')}>
                        <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="patient-blood" className="text-xs">Blood Type</Label>
                      <Select value={newPatientBloodType} onValueChange={setNewPatientBloodType}>
                        <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPE_OPTIONS.map((bt) => (
                            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="patient-phone" className="text-xs">Phone Number</Label>
                    <Input id="patient-phone" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} placeholder="0721 345 678" className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Emergency Contact</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="patient-ec-name" className="text-xs">Contact Name</Label>
                    <Input id="patient-ec-name" value={newPatientEmergencyName} onChange={(e) => setNewPatientEmergencyName(e.target.value)} placeholder="Maria Popescu" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="patient-ec-phone" className="text-xs">Contact Phone</Label>
                    <Input id="patient-ec-phone" value={newPatientEmergencyPhone} onChange={(e) => setNewPatientEmergencyPhone(e.target.value)} placeholder="0731 222 333" className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Clinical Information</legend>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="patient-diagnosis" className="text-xs">Diagnosis *</Label>
                    <Input id="patient-diagnosis" value={newPatientDiagnosis} onChange={(e) => setNewPatientDiagnosis(e.target.value)} placeholder="Primary diagnosis" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="patient-attending" className="text-xs">Attending Physician</Label>
                    <Input id="patient-attending" value={newPatientAttending} onChange={(e) => setNewPatientAttending(e.target.value)} placeholder="Dr. Maria Constantinescu" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="patient-allergies" className="text-xs">Allergies</Label>
                    <Textarea id="patient-allergies" value={newPatientAllergies} onChange={(e) => setNewPatientAllergies(e.target.value)} placeholder="e.g. Penicillin, Latex" className="mt-1 text-sm min-h-[60px]" rows={2} />
                  </div>
                </div>
              </fieldset>
            </div>
          </ScrollArea>
          <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { resetPatientForm(); setShowAddPatientDialog(null); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => showAddPatientDialog && handleAddPatient(showAddPatientDialog)}
              disabled={!newPatientName.trim() || !newPatientAge || !newPatientDiagnosis.trim() || isSubmittingPatient}
            >
              {isSubmittingPatient ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                showAddPatientDialog === 'standalone' ? 'Add to Unassigned' : 'Add & Assign to Bed'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Assign Patient Dialog */}
      <Dialog open={!!showAssignPatientDialog} onOpenChange={() => setShowAssignPatientDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Assign Patient</DialogTitle>
            <DialogDescription className="text-xs">
              Select a patient to assign to bed {wardBeds.find(b => b.id === showAssignPatientDialog)?.bedNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            {unassignedPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No unassigned patients</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {unassignedPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      if (showAssignPatientDialog) {
                        handleAssignPatientToBed(patient.id, showAssignPatientDialog);
                        setShowAssignPatientDialog(null);
                      }
                    }}
                    className="w-full p-2 text-left bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
                  >
                    <span className="font-medium">{patient.name}</span>
                    <span className="text-muted-foreground ml-2">{patient.age}y, {patient.diagnosis}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAssignPatientDialog(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Remove Patient Confirmation */}
      <Dialog open={!!showRemovePatientConfirm} onOpenChange={() => setShowRemovePatientConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Remove Patient</DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently remove the patient from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRemovePatientConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (showRemovePatientConfirm) {
                  removePatient(showRemovePatientConfirm);
                  setShowRemovePatientConfirm(null);
                }
              }}
            >
              Remove Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'critical' | 'warning';
}) {
  return (
    <div className={cn(
      'p-2 rounded border text-center',
      variant === 'critical' && value > 0 ? 'bg-critical/5 border-critical/30' :
      variant === 'warning' && value > 0 ? 'bg-warning/5 border-warning/30' :
      'bg-card border-border'
    )}>
      <div className={cn(
        'text-lg font-semibold tabular-nums',
        variant === 'critical' && value > 0 ? 'text-critical' :
        variant === 'warning' && value > 0 ? 'text-warning' :
        'text-foreground'
      )}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

interface Bed {
  id: string;
  bedNumber: string;
  wardId: string;
  patient?: Patient;
}

function WardFloorPlan({
  beds,
  patients,
  allPatients,
  highlightedBed,
  onSelectPatient,
  statusFilter,
  wardName,
  onDeleteBed,
  onAssignPatient,
  onUnassignPatient,
  onRemovePatient,
  hasUnassignedPatients,
}: {
  beds: Bed[];
  patients: Patient[];
  allPatients: Patient[];
  highlightedBed: string | null;
  onSelectPatient: (patient: Patient) => void;
  statusFilter: StatusFilter;
  wardName: string;
  onDeleteBed: (bedId: string) => void;
  onAssignPatient: (bedId: string) => void;
  onUnassignPatient: (bedId: string) => void;
  onRemovePatient: (patientId: string) => void;
  hasUnassignedPatients: boolean;
}) {
  const midpoint = Math.ceil(beds.length / 2);
  const leftBeds = beds.slice(0, midpoint);
  const rightBeds = beds.slice(midpoint);

  const isFiltered = (bedNumber: string) => {
    const patient = allPatients.find((p) => p.bedNumber === bedNumber);
    if (!patient) return statusFilter === 'all';
    return patients.some((p) => p.bedNumber === bedNumber);
  };

  return (
    <div className="bg-card border border-border rounded p-4">
      {/* Ward Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-success rounded-full" />
          <span className="text-xs font-medium text-foreground">{wardName}</span>
          <span className="text-[10px] text-muted-foreground">{beds.length} beds</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Nurses Station
        </div>
      </div>
      {/* Floor Plan Grid */}
      <div className="grid grid-cols-[1fr_40px_1fr] gap-1 min-w-[500px]">
        {/* Left Side */}
        <div className="space-y-1">
          {leftBeds.map((bed) => (
            <FloorBed
              key={bed.id}
              bedId={bed.id}
              bedNumber={bed.bedNumber}
              patient={bed.patient}
              isHighlighted={highlightedBed === bed.bedNumber}
              isFiltered={isFiltered(bed.bedNumber)}
              statusFilter={statusFilter}
              onClick={() => bed.patient && isFiltered(bed.bedNumber) && onSelectPatient(bed.patient)}
              onDelete={() => onDeleteBed(bed.id)}
              onAssignPatient={() => onAssignPatient(bed.id)}
              onUnassignPatient={() => onUnassignPatient(bed.id)}
              onRemovePatient={() => bed.patient && onRemovePatient(bed.patient.id)}
              hasUnassignedPatients={hasUnassignedPatients}
              side="left"
            />
          ))}
        </div>
        {/* Corridor */}
        <div className="bg-muted/50 rounded" />
        {/* Right Side */}
        <div className="space-y-1">
          {rightBeds.map((bed) => (
            <FloorBed
              key={bed.id}
              bedId={bed.id}
              bedNumber={bed.bedNumber}
              patient={bed.patient}
              isHighlighted={highlightedBed === bed.bedNumber}
              isFiltered={isFiltered(bed.bedNumber)}
              statusFilter={statusFilter}
              onClick={() => bed.patient && isFiltered(bed.bedNumber) && onSelectPatient(bed.patient)}
              onDelete={() => onDeleteBed(bed.id)}
              onAssignPatient={() => onAssignPatient(bed.id)}
              onUnassignPatient={() => onUnassignPatient(bed.id)}
              onRemovePatient={() => bed.patient && onRemovePatient(bed.patient.id)}
              hasUnassignedPatients={hasUnassignedPatients}
              side="right"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloorBed({
  bedId,
  bedNumber,
  patient,
  isHighlighted,
  isFiltered,
  statusFilter,
  onClick,
  onDelete,
  onAssignPatient,
  onUnassignPatient,
  onRemovePatient,
  hasUnassignedPatients,
  side,
}: {
  bedId: string;
  bedNumber: string;
  patient: Patient | undefined;
  isHighlighted: boolean;
  isFiltered: boolean;
  statusFilter: StatusFilter;
  onClick: () => void;
  onDelete: () => void;
  onAssignPatient: () => void;
  onUnassignPatient: () => void;
  onRemovePatient: () => void;
  hasUnassignedPatients: boolean;
  side: 'left' | 'right';
}) {
  const isEmpty = !patient;
  const isDimmed = !isEmpty && !isFiltered && statusFilter !== 'all';

  const statusStyles = {
    stable: { bg: 'bg-success/5', border: 'border-success/30', dot: 'bg-success' },
    warning: { bg: 'bg-warning/5', border: 'border-warning/30', dot: 'bg-warning' },
    critical: { bg: 'bg-critical/5', border: 'border-critical/30', dot: 'bg-critical animate-subtle-pulse' },
  };

  const styles = patient ? statusStyles[patient.status] : null;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 p-2 rounded border transition-all',
        side === 'right' && 'flex-row-reverse',
        isEmpty && 'bg-muted/20 border-dashed border-border',
        !isEmpty && !isDimmed && styles?.bg,
        !isEmpty && !isDimmed && styles?.border,
        isDimmed && 'opacity-30',
        isHighlighted && 'ring-1 ring-primary',
        !isEmpty && !isDimmed && 'cursor-pointer hover:shadow-sm'
      )}
      onClick={!isEmpty && !isDimmed ? onClick : undefined}
    >
      {/* Bed Icon and Number Container */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Bed className={cn(
          "w-4 h-4 transition-all duration-300",
          isEmpty ? "text-muted-foreground opacity-30" : cn("opacity-70", styles?.dot.replace('bg-', 'text-'))
        )} />
        <div className={cn(
          'px-2 py-0.5 rounded border text-[10px] font-medium transition-all duration-300',
          isEmpty 
            ? 'bg-muted/10 border-border text-muted-foreground' 
            : 'bg-background border-current/20 text-foreground'
        )}>
          {bedNumber}
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="flex items-center gap-1.5 opacity-40">
            <User className="w-3 h-3" />
            <span className="text-[10px] font-medium tracking-tight">Empty</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)]', styles?.dot)} />
            <div className="flex items-center gap-1.5 min-w-0">
              <User className={cn("w-3.5 h-3.5 shrink-0 opacity-70", styles?.dot.replace('bg-', 'text-'))} />
              <span className="text-xs font-medium text-foreground truncate tracking-tight">{patient.name}</span>
            </div>
            {patient.status !== 'stable' && (
              <span className={cn(
                'text-[10px] font-bold italic ml-auto',
                patient.status === 'warning' ? 'text-warning' : 'text-critical'
              )}>
                {patient.sepsisRiskScore}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity">
            <MoreVertical className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {isEmpty ? (
            <>
              <DropdownMenuItem onClick={onAssignPatient} className="text-xs">
                <UserPlus className="w-3 h-3 mr-2" />
                Assign Patient
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={onUnassignPatient} className="text-xs">
                <UserMinus className="w-3 h-3 mr-2" />
                Unassign Patient
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemovePatient} className="text-xs text-destructive focus:text-destructive">
                <Trash2 className="w-3 h-3 mr-2" />
                Remove Patient
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive focus:text-destructive">
            <Trash2 className="w-3 h-3 mr-2" />
            Delete Bed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function BedGridCard({
  bedId,
  bedNumber,
  patient,
  isHighlighted,
  isFiltered,
  onClick,
  onDelete,
  onAssignPatient,
  onUnassignPatient,
  onRemovePatient,
  hasUnassignedPatients,
}: {
  bedId: string;
  bedNumber: string;
  patient: Patient | undefined;
  isHighlighted: boolean;
  isFiltered: boolean;
  onClick: () => void;
  onDelete: () => void;
  onAssignPatient: () => void;
  onUnassignPatient: () => void;
  onRemovePatient: () => void;
  hasUnassignedPatients: boolean;
}) {
  const isEmpty = !patient;

  const statusStyles = {
    stable: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    critical: 'border-critical/30 bg-critical/5',
  };

  return (
    <div
      className={cn(
        'group relative p-2 rounded border transition-all',
        isEmpty && 'border-dashed border-border bg-muted/20',
        !isEmpty && isFiltered && statusStyles[patient.status],
        !isEmpty && isFiltered && 'cursor-pointer hover:shadow-sm',
        !isEmpty && !isFiltered && 'opacity-30',
        isHighlighted && 'ring-1 ring-primary'
      )}
      onClick={!isEmpty && isFiltered ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-muted-foreground">{bedNumber}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-opacity">
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {isEmpty ? (
              <>
                <DropdownMenuItem onClick={onAssignPatient} className="text-xs">
                  <UserPlus className="w-3 h-3 mr-2" />
                  Assign Patient
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={onUnassignPatient} className="text-xs">
                  <UserMinus className="w-3 h-3 mr-2" />
                  Unassign Patient
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRemovePatient} className="text-xs text-destructive focus:text-destructive">
                  <Trash2 className="w-3 h-3 mr-2" />
                  Remove Patient
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive focus:text-destructive">
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Bed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isEmpty ? (
        <div className="flex items-center gap-1.5 opacity-40 py-1">
          <User className="w-3 h-3" />
          <span className="text-[10px] font-medium tracking-tight">Empty</span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className={cn("w-3.5 h-3.5 shrink-0 opacity-70", {
              'text-success': patient.status === 'stable',
              'text-warning': patient.status === 'warning',
              'text-critical': patient.status === 'critical',
            })} />
            <p className="text-xs font-semibold text-foreground truncate tracking-tight flex-1">{patient.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground truncate ml-5">{patient.diagnosis}</p>
          {patient.status !== 'stable' && (
            <div className="flex items-center gap-1 ml-5 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn('h-full rounded-full', {
                    'bg-warning': patient.status === 'warning',
                    'bg-critical': patient.status === 'critical',
                  })}
                  style={{ width: `${patient.sepsisRiskScore}%` }}
                />
              </div>
              <span className={cn('text-[9px] font-bold italic', {
                'text-warning': patient.status === 'warning',
                'text-critical': patient.status === 'critical',
              })}>
                {patient.sepsisRiskScore}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: 'success' | 'warning' | 'critical' | 'empty'; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn('w-2 h-2 rounded-sm', {
          'bg-success': color === 'success',
          'bg-warning': color === 'warning',
          'bg-critical': color === 'critical',
          'bg-muted border border-dashed border-border': color === 'empty',
        })}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
