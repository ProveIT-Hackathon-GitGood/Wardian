'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { FLOORS, type Patient, type Alert, type Floor, type Ward, MOCK_ALERTS } from './mock-data';
import { getBeds } from './api/services/beds';
import { getPatients } from './api/services/patients';

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
  if (!name) return 'UN';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [selectedFloor, setSelectedFloor] = useState(FLOORS[0].id);
  const [selectedWard, setSelectedWard] = useState(FLOORS[0].wards[0].id);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedBed, setHighlightedBed] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [floors, setFloors] = useState<Floor[]>(FLOORS);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsData, bedsData] = await Promise.all([
          getPatients(),
          getBeds()
        ]);
        
        const mappedPatients: Patient[] = patientsData.map(p => ({
          id: `patient-${p.id}`,
          backendId: p.id,
          name: p.name,
          initials: generateInitials(p.name),
          age: p.age,
          gender: p.gender as 'M' | 'F',
          bedNumber: '',
          status: p.sepsis_risk_score && p.sepsis_risk_score > 50 ? 'critical' : (p.sepsis_risk_score && p.sepsis_risk_score > 20 ? 'warning' : 'stable'),
          sepsisRiskScore: p.sepsis_risk_score || 0,
          aiInsight: p.ai_insight || '',
          admissionDate: p.admission_date,
          diagnosis: p.diagnosis || '',
          attendingPhysician: p.attending_physician,
          vitals: {
            heartRate: 70,
            temperature: 36.5,
            bloodPressure: '120/80',
            oxygenSaturation: 98,
            respiratoryRate: 15
          },
          medicalHistory: [],
          performedSurgery: p.performed_surgery || undefined,
          cnp: p.cnp,
          phoneNumber: p.phone_number,
          emergencyContactName: p.emergency_contact_name,
          emergencyContactPhone: p.emergency_contact,
          bloodType: p.blood_type,
          allergies: p.allergies || undefined,
        }));

        const mappedBeds: Bed[] = bedsData.map(b => {
          const bp = patientsData.find(pt => pt.bed_id === b.id);
          const mappedP = bp ? mappedPatients.find(m => m.backendId === bp.id) : undefined;
          if (mappedP) {
            mappedP.bedNumber = b.bed_number;
          }
          return {
            id: `bed-${b.id}`,
            backendId: b.id,
            bedNumber: b.bed_number,
            // For now map all beds to 'ward-a' to be visible, or match ward names from FLOORS
            wardId: 'ward-a',
            patient: mappedP
          };
        });

        const unassignedList = mappedPatients.filter(p => !patientsData.find(pd => pd.id === p.backendId)?.bed_id);
        
        setBeds(mappedBeds);
        setUnassignedPatients(unassignedList);
      } catch (err) {
        console.error('Failed to load beds and patients:', err);
      }
    };
    fetchData();
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
