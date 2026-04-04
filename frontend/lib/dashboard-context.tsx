'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { FLOORS, type Patient, type Alert, type Floor, type Ward } from './mock-data';
import { apiGet } from './api/client';

interface BackendBed {
  id: number;
  ward_id: number;
  bed_number: string;
  is_occupied: boolean;
}

interface BackendAlert {
  id: number;
  patient_id: number;
  bed_id: number;
  ward_id: number;
  type: string;
  message: string | null;
  created_at: string;
  is_ready: boolean;
}

interface BackendPatient {
  id: number;
  bed_id: number | null;
  name: string;
  age: number;
  gender: string;
  cnp: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact: string;
  attending_physician: string;
  blood_type: string;
  allergies?: string;
  admission_date: string;
  ai_insight?: string;
  diagnosis?: string;
  performed_surgery?: string;
  clinical_notes?: string;
  sepsis_risk_score?: number;
  is_active?: boolean;
}

interface Bed {
  id: string;
  backendId?: number;
  bedNumber: string;
  wardId: string;
  patient?: Patient;
}

interface DashboardContextType {
  selectedFloor: string;
  selectedWard: string;
  floors: Floor[];
  patients: Patient[];
  alerts: Alert[];
  selectedPatient: Patient | null;
  searchQuery: string;
  highlightedBed: string | null;
  beds: Bed[];
  setSelectedFloor: (floor: string) => void;
  setSelectedWard: (ward: string) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedBed: (bed: string | null) => void;
  markAlertAsRead: (alertId: string) => void;
  unreadAlertCount: number;
  addWard: (floorId: string, wardName: string) => void;
  deleteWard: (floorId: string, wardId: string) => void;
  addBed: (wardId: string, backendId?: number) => void;
  deleteBed: (bedId: string) => void;
  getCurrentWardBeds: () => Bed[];
  addPatient: (patient: Omit<Patient, 'id' | 'initials'>, bedId: string) => void;
  addUnassignedPatient: (patient: Omit<Patient, 'id' | 'initials'>) => void;
  getBedBackendId: (bedId: string) => number | undefined;
  getPatientBackendId: (patientId: string) => number | undefined;
  updatePatient: (patientId: string, updates: Partial<Patient>) => void;
  removePatient: (patientId: string) => void;
  assignPatientToBed: (patientId: string, bedId: string) => void;
  unassignPatientFromBed: (bedId: string) => void;
  getUnassignedPatients: () => Patient[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);


// Generate initials from name
function generateInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedFloor, setSelectedFloor] = useState(FLOORS[0].id);
  const [selectedWard, setSelectedWard] = useState(FLOORS[0].wards[0].id);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedBed, setHighlightedBed] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [floors, setFloors] = useState<Floor[]>(FLOORS);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  useEffect(() => {
    async function loadAlerts() {
      try {
        const backendAlerts = await apiGet<BackendAlert[]>("/api/v1/alert", true) || [];
        if (!Array.isArray(backendAlerts)) return;
        const formattedAlerts: Alert[] = backendAlerts.map((alert) => ({
          id: alert.id.toString(),
          patientId: alert.patient_id.toString(),
          patientName: `Patient ${alert.patient_id}`,
          bedNumber: alert.bed_id.toString(),
          ward: `Ward ${alert.ward_id}`,
          type: alert.type.toLowerCase() as 'critical' | 'warning' | 'info',
          message: alert.message || '',
          timestamp: alert.created_at || new Date().toISOString(),
          isRead: alert.is_ready,
        }));
        setAlerts(formattedAlerts);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    }

    loadAlerts();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    function connect() {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/dashboard';
      console.log('Attempting WebSocket connection to:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to alert websocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type && data.message) {
            setAlerts(prev => {
              if (prev.some(a => a.id === data.id?.toString())) {
                return prev;
              }
              const newAlert: Alert = {
                id: data.id?.toString() || Math.random().toString(),
                patientId: data.patientId?.toString() || data.patient_id?.toString() || '',
                patientName: data.patientName || `Patient ${data.patient_id || data.patientId}`,
                bedNumber: data.bedNumber?.toString() || data.bed_id?.toString() || '',
                ward: data.ward || (data.ward_id ? `Ward ${data.ward_id}` : ''),
                type: data.type?.toLowerCase() || 'info',
                message: data.message || '',
                timestamp: data.timestamp || data.created_at || new Date().toISOString(),
                isRead: data.isRead || data.is_ready || false,
              };
              return [newAlert, ...prev];
            });
          }
        } catch (err) {
          console.error('Error parsing websocket message', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      ws.onclose = (event) => {
        console.log('Disconnected from alert websocket. Code:', event.code, 'Reason:', event.reason);
        if (isMounted) {
          console.log('Reconnecting in 3 seconds...');
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);
  useEffect(() => {
    async function loadData() {
      try {
        const [backendBeds, backendPatients] = await Promise.all([
          apiGet<BackendBed[]>('/api/v1/bed', true),
          apiGet<BackendPatient[]>('/api/v1/patient', true)
        ]);

        const mappedPatients: Patient[] = backendPatients.map(bp => ({
          id: `patient-${bp.id}`,
          backendId: bp.id,
          name: bp.name,
          initials: generateInitials(bp.name),
          age: bp.age,
          gender: bp.gender as 'M' | 'F',
          bedNumber: '',
          status: 'stable',
          sepsisRiskScore: bp.sepsis_risk_score ?? 0,
          aiInsight: bp.ai_insight ?? '',
          admissionDate: bp.admission_date,
          diagnosis: bp.diagnosis ?? '',
          attendingPhysician: bp.attending_physician,
          vitals: {
            heartRate: 70,
            temperature: 37,
            bloodPressure: '120/80',
            oxygenSaturation: 98,
            respiratoryRate: 16
          },
          medicalHistory: [],
          performedSurgery: bp.performed_surgery,
          clinicalObservations: bp.clinical_notes,
          cnp: bp.cnp,
          phoneNumber: bp.phone_number,
          emergencyContactName: bp.emergency_contact_name,
          emergencyContactPhone: bp.emergency_contact,
          bloodType: bp.blood_type,
          allergies: bp.allergies,
        }));

        const newBeds: Bed[] = backendBeds.map(bb => {
          const patientData = backendPatients.find(bp => bp.bed_id === bb.id);
          const mappedPatient = patientData ? mappedPatients.find(p => p.backendId === patientData.id) : undefined;
          if (mappedPatient) {
            mappedPatient.bedNumber = bb.bed_number;
          }
          return {
            id: `bed-${bb.id}`,
            backendId: bb.id,
            bedNumber: bb.bed_number,
            wardId: 'ward-a',
            patient: mappedPatient
          };
        });

        const newUnassigned = mappedPatients.filter(p => {
          const bp = backendPatients.find(x => x.id === p.backendId);
          return bp && !bp.bed_id;
        });

        setBeds(newBeds);
        setUnassignedPatients(newUnassigned);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    }

    loadData();
  }, []);

  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }, []);

  const addWard = useCallback((floorId: string, wardName: string) => {
    setFloors((prev) =>
      prev.map((floor) => {
        if (floor.id === floorId) {
          const newWardId = `ward-${Date.now()}`;
          const newWard: Ward = {
            id: newWardId,
            name: wardName,
            floor: floor.name.split(' - ')[0],
          };
          return {
            ...floor,
            wards: [...floor.wards, newWard],
          };
        }
        return floor;
      })
    );
  }, []);

  const deleteWard = useCallback((floorId: string, wardId: string) => {
    // Move patients to unassigned
    setBeds((prev) => {
      const wardBeds = prev.filter((bed) => bed.wardId === wardId);
      const patientsToUnassign = wardBeds.filter(b => b.patient).map(b => b.patient as Patient);
      if (patientsToUnassign.length > 0) {
        setUnassignedPatients(current => [...current, ...patientsToUnassign]);
      }
      return prev.filter((bed) => bed.wardId !== wardId);
    });

    setFloors((prev) =>
      prev.map((floor) => {
        if (floor.id === floorId) {
          return {
            ...floor,
            wards: floor.wards.filter((w) => w.id !== wardId),
          };
        }
        return floor;
      })
    );
  }, []);

  const addBed = useCallback((wardId: string, backendId?: number) => {
    setBeds((prev) => {
      const wardBeds = prev.filter((b) => b.wardId === wardId);
      const maxBedNum = wardBeds.reduce((max, b) => {
        const num = parseInt(b.bedNumber, 10);
        return num > max ? num : max;
      }, 0);
      const nextBedNumber = String(maxBedNum + 1).padStart(2, '0');
      const newBed: Bed = {
        id: `bed-${wardId}-${Date.now()}`,
        backendId,
        bedNumber: nextBedNumber,
        wardId,
        patient: undefined,
      };
      return [...prev, newBed];
    });
  }, []);

  const deleteBed = useCallback((bedId: string) => {
    setBeds((prev) => {
      const bed = prev.find(b => b.id === bedId);
      if (bed?.patient) {
        setUnassignedPatients(current => [...current, bed.patient as Patient]);
      }
      return prev.filter((b) => b.id !== bedId);
    });
  }, []);

  const getCurrentWardBeds = useCallback(() => {
    return beds.filter((bed) => bed.wardId === selectedWard);
  }, [beds, selectedWard]);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'initials'>, bedId: string) => {
    const newPatient: Patient = {
      ...patientData,
      id: `patient-${Date.now()}`,
      initials: generateInitials(patientData.name),
    };

    setBeds((prev) =>
      prev.map((bed) =>
        bed.id === bedId ? { ...bed, patient: newPatient } : bed
      )
    );
  }, []);

  const addUnassignedPatient = useCallback((patientData: Omit<Patient, 'id' | 'initials'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `patient-${Date.now()}`,
      initials: generateInitials(patientData.name),
    };
    setUnassignedPatients((prev) => [...prev, newPatient]);
  }, []);

  const updatePatient = useCallback((patientId: string, updates: Partial<Patient>) => {
    const applyUpdate = (p: Patient) => {
      const updated = { ...p, ...updates };
      if (updates.name && updates.name !== p.name) {
        updated.initials = generateInitials(updates.name);
      }
      return updated;
    };

    setBeds((prev) =>
      prev.map((bed) =>
        bed.patient?.id === patientId
          ? { ...bed, patient: applyUpdate(bed.patient) }
          : bed
      )
    );
    setUnassignedPatients((prev) =>
      prev.map((p) => (p.id === patientId ? applyUpdate(p) : p))
    );
    setSelectedPatient((prev) =>
      prev?.id === patientId ? applyUpdate(prev) : prev
    );
  }, []);

  const removePatient = useCallback((patientId: string) => {
    setBeds((prev) =>
      prev.map((bed) =>
        bed.patient?.id === patientId ? { ...bed, patient: undefined } : bed
      )
    );
    setUnassignedPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  const assignPatientToBed = useCallback((patientId: string, bedId: string) => {
    const patient = unassignedPatients.find(p => p.id === patientId);
    if (patient) {
      setBeds((prev) =>
        prev.map((bed) =>
          bed.id === bedId ? { ...bed, patient } : bed
        )
      );
      setUnassignedPatients((prev) => prev.filter((p) => p.id !== patientId));
    }
  }, [unassignedPatients]);

  const unassignPatientFromBed = useCallback((bedId: string) => {
    setBeds((prev) => {
      const bed = prev.find(b => b.id === bedId);
      if (bed?.patient) {
        setUnassignedPatients(current => [...current, bed.patient as Patient]);
      }
      return prev.map((b) =>
        b.id === bedId ? { ...b, patient: undefined } : b
      );
    });
  }, []);

  const getUnassignedPatients = useCallback(() => {
    return unassignedPatients;
  }, [unassignedPatients]);

  const getBedBackendId = useCallback((bedId: string): number | undefined => {
    return beds.find((b) => b.id === bedId)?.backendId;
  }, [beds]);

  const getPatientBackendId = useCallback((patientId: string): number | undefined => {
    const bedPatient = beds.find((b) => b.patient?.id === patientId)?.patient;
    if (bedPatient?.backendId) return bedPatient.backendId;
    return unassignedPatients.find((p) => p.id === patientId)?.backendId;
  }, [beds, unassignedPatients]);

  const patients = beds
    .filter((bed) => bed.patient)
    .map((bed) => bed.patient as Patient);

  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  return (
    <DashboardContext.Provider
      value={{
        selectedFloor,
        selectedWard,
        floors,
        patients,
        alerts,
        selectedPatient,
        searchQuery,
        highlightedBed,
        beds,
        setSelectedFloor,
        setSelectedWard,
        setSelectedPatient,
        setSearchQuery,
        setHighlightedBed,
        markAlertAsRead,
        unreadAlertCount,
        addWard,
        deleteWard,
        addBed,
        deleteBed,
        getCurrentWardBeds,
        addPatient,
        addUnassignedPatient,
        updatePatient,
        removePatient,
        assignPatientToBed,
        unassignPatientFromBed,
        getUnassignedPatients,
        getBedBackendId,
        getPatientBackendId,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
