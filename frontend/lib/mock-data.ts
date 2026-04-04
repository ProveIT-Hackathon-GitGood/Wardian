export type PatientStatus = 'stable' | 'warning' | 'critical';

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  gender: 'M' | 'F';
  bedNumber: string;
  status: PatientStatus;
  sepsisRiskScore: number;
  aiInsight: string;
  admissionDate: string;
  diagnosis: string;
  attendingPhysician: string;
  vitals: {
    heartRate: number;
    temperature: number;
    bloodPressure: string;
    oxygenSaturation: number;
    respiratoryRate: number;
  };
  medicalHistory: HistoryEvent[];
  performedSurgery?: string;
  clinicalObservations?: string;
  cnp?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
}

export interface HistoryEvent {
  id: string;
  type: 'surgery' | 'lab' | 'medication' | 'admission' | 'observation';
  title: string;
  description: string;
  date: string;
  time: string;
  details?: string;
  attachments?: { name: string; url: string }[];
  surgeryType?: string;
  analysisResult?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  ward: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Ward {
  id: string;
  name: string;
  floor: string;
}

export interface Floor {
  id: string;
  name: string;
  wards: Ward[];
}

export const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const SURGERY_OPTIONS = [
  'Laparoscopic Cholecystectomy',
  'Coronary Artery Bypass Grafting',
  'Hip Replacement',
  'Knee Replacement',
  'Appendectomy',
  'Cesarean Section',
  'Spinal Fusion',
  'Hernia Repair',
  'Colectomy',
  'Mastectomy',
  'Thyroidectomy',
  'Gastric Bypass',
  'Carotid Endarterectomy',
  'Aortic Valve Replacement',
  'Nephrectomy',
  'Prostatectomy',
  'Craniotomy',
  'Laminectomy',
  'Rotator Cuff Repair',
  'ACL Reconstruction',
  'Hysterectomy',
  'Lobectomy',
];

export const FLOORS: Floor[] = [
  {
    id: 'floor-2',
    name: '2nd Floor - Cardiology',
    wards: [
      { id: 'ward-a', name: 'Ward A', floor: '2nd Floor' },
      { id: 'ward-b', name: 'Ward B', floor: '2nd Floor' },
    ],
  },
  {
    id: 'floor-3',
    name: '3rd Floor - Neurology',
    wards: [
      { id: 'ward-c', name: 'Ward C', floor: '3rd Floor' },
      { id: 'ward-d', name: 'Ward D', floor: '3rd Floor' },
    ],
  },
  {
    id: 'floor-4',
    name: '4th Floor - Oncology',
    wards: [
      { id: 'ward-e', name: 'Ward E', floor: '4th Floor' },
      { id: 'ward-f', name: 'Ward F', floor: '4th Floor' },
    ],
  },
];

export const HOSPITALS = [
  'Central University Hospital',
  'St. Mary Medical Center',
  'Regional General Hospital',
  'Metropolitan Health System',
  'Community Memorial Hospital',
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Andrei Vasilescu',
    initials: 'AV',
    age: 67,
    gender: 'M',
    bedNumber: '01',
    status: 'stable',
    sepsisRiskScore: 15,
    aiInsight: 'Patient vitals are within normal parameters. Continue routine monitoring.',
    admissionDate: '2024-03-28',
    diagnosis: 'Post-operative recovery - Hernia Repair',
    attendingPhysician: 'Dr. Elena Radu',
    vitals: {
      heartRate: 72,
      temperature: 36.8,
      bloodPressure: '120/80',
      oxygenSaturation: 98,
      respiratoryRate: 16,
    },
    medicalHistory: [
      { id: 'h1', type: 'admission', title: 'Hospital Admission', description: 'Admitted for hernia repair surgery', date: '2024-03-28', time: '08:00' },
      { id: 'h2', type: 'surgery', title: 'Hernia Repair', description: 'Laparoscopic inguinal hernia repair', date: '2024-03-28', time: '10:30' },
      { id: 'h3', type: 'lab', title: 'Blood Panel', description: 'Complete blood count - all normal', date: '2024-03-29', time: '06:00' },
    ],
    cnp: '1570415123456',
    phoneNumber: '0721 345 678',
    emergencyContactName: 'Maria Vasilescu',
    emergencyContactPhone: '0731 222 333',
    bloodType: 'A+',
    allergies: 'Penicillin',
  },
  {
    id: 'p2',
    name: 'Elena Dumitrescu',
    initials: 'ED',
    age: 54,
    gender: 'F',
    bedNumber: '02',
    status: 'stable',
    sepsisRiskScore: 22,
    aiInsight: 'Slight elevation in WBC count. Recommend continued antibiotic therapy and monitoring.',
    admissionDate: '2024-03-27',
    diagnosis: 'Pneumonia - Community Acquired',
    attendingPhysician: 'Dr. Mihai Popescu',
    vitals: {
      heartRate: 78,
      temperature: 37.2,
      bloodPressure: '118/76',
      oxygenSaturation: 96,
      respiratoryRate: 18,
    },
    medicalHistory: [
      { id: 'h4', type: 'admission', title: 'Emergency Admission', description: 'Admitted via ER with respiratory distress', date: '2024-03-27', time: '14:30' },
      { id: 'h5', type: 'lab', title: 'Chest X-Ray', description: 'Bilateral infiltrates consistent with pneumonia', date: '2024-03-27', time: '15:00' },
      { id: 'h6', type: 'medication', title: 'Antibiotic Started', description: 'IV Azithromycin 500mg daily', date: '2024-03-27', time: '16:00' },
    ],
    cnp: '2700312654321',
    phoneNumber: '0744 567 890',
    emergencyContactName: 'Mihai Dumitrescu',
    emergencyContactPhone: '0755 111 222',
    bloodType: 'O-',
  },
  {
    id: 'p3',
    name: 'Gheorghe Stanescu',
    initials: 'GS',
    age: 71,
    gender: 'M',
    bedNumber: '03',
    status: 'stable',
    sepsisRiskScore: 18,
    aiInsight: 'Post-operative day 3, recovering well. Vital signs stable.',
    admissionDate: '2024-03-26',
    diagnosis: 'Coronary Artery Disease - Post CABG',
    attendingPhysician: 'Dr. Alexandru Ionescu',
    vitals: {
      heartRate: 68,
      temperature: 36.9,
      bloodPressure: '130/85',
      oxygenSaturation: 97,
      respiratoryRate: 14,
    },
    medicalHistory: [
      { id: 'h7', type: 'admission', title: 'Scheduled Admission', description: 'Admitted for CABG surgery', date: '2024-03-26', time: '06:00' },
      { id: 'h8', type: 'surgery', title: 'CABG x3', description: 'Triple coronary artery bypass grafting', date: '2024-03-26', time: '08:00' },
      { id: 'h9', type: 'observation', title: 'ICU Transfer', description: 'Transferred to ICU post-surgery', date: '2024-03-26', time: '14:00' },
      { id: 'h10', type: 'observation', title: 'Ward Transfer', description: 'Transferred to Ward A', date: '2024-03-28', time: '10:00' },
    ],
  },
  {
    id: 'p4',
    name: 'Ion Popescu',
    initials: 'IP',
    age: 62,
    gender: 'M',
    bedNumber: '04',
    status: 'critical',
    sepsisRiskScore: 87,
    aiInsight: 'CRITICAL: High sepsis risk due to persistent tachycardia (HR 112), elevated temperature (38.9°C), and post-op Day 2 following emergency laparotomy. Elevated lactate levels and WBC >15,000. Immediate intervention recommended.',
    admissionDate: '2024-03-29',
    diagnosis: 'Perforated Appendix - Post Emergency Laparotomy',
    attendingPhysician: 'Dr. Maria Constantinescu',
    vitals: {
      heartRate: 112,
      temperature: 38.9,
      bloodPressure: '95/60',
      oxygenSaturation: 92,
      respiratoryRate: 24,
    },
    medicalHistory: [
      { id: 'h11', type: 'admission', title: 'Emergency Admission', description: 'Admitted via ER with acute abdominal pain', date: '2024-03-29', time: '02:30' },
      { id: 'h12', type: 'lab', title: 'CT Scan Abdomen', description: 'Perforated appendix with free fluid', date: '2024-03-29', time: '03:15' },
      { id: 'h13', type: 'surgery', title: 'Emergency Laparotomy', description: 'Appendectomy with peritoneal lavage', date: '2024-03-29', time: '04:30' },
      { id: 'h14', type: 'medication', title: 'Broad Spectrum Antibiotics', description: 'Piperacillin-Tazobactam + Metronidazole started', date: '2024-03-29', time: '05:00' },
      { id: 'h15', type: 'lab', title: 'Sepsis Markers', description: 'Lactate: 4.2 mmol/L, Procalcitonin: 8.5 ng/mL', date: '2024-03-30', time: '06:00' },
    ],
    performedSurgery: 'Appendectomy',
    cnp: '1620815234567',
    phoneNumber: '0762 890 123',
    emergencyContactName: 'Ana Popescu',
    emergencyContactPhone: '0723 444 555',
    bloodType: 'B+',
    allergies: 'Sulfonamides, Latex',
  },
  {
    id: 'p5',
    name: 'Maria Ionescu',
    initials: 'MI',
    age: 58,
    gender: 'F',
    bedNumber: '05',
    status: 'warning',
    sepsisRiskScore: 52,
    aiInsight: 'Moderate sepsis risk. Elevated temperature and tachycardia noted post-procedure. Close monitoring advised. Consider blood cultures if fever persists.',
    admissionDate: '2024-03-28',
    diagnosis: 'Cholecystitis - Post Laparoscopic Cholecystectomy',
    attendingPhysician: 'Dr. Andrei Munteanu',
    vitals: {
      heartRate: 98,
      temperature: 38.2,
      bloodPressure: '110/70',
      oxygenSaturation: 95,
      respiratoryRate: 20,
    },
    medicalHistory: [
      { id: 'h16', type: 'admission', title: 'Scheduled Admission', description: 'Admitted for elective cholecystectomy', date: '2024-03-28', time: '07:00' },
      { id: 'h17', type: 'surgery', title: 'Lap Cholecystectomy', description: 'Laparoscopic cholecystectomy completed', date: '2024-03-28', time: '09:30' },
      { id: 'h18', type: 'observation', title: 'Post-op Fever', description: 'Temperature spike to 38.2°C noted', date: '2024-03-29', time: '18:00' },
      { id: 'h19', type: 'lab', title: 'Blood Cultures', description: 'Blood cultures ordered', date: '2024-03-29', time: '19:00' },
    ],
    performedSurgery: 'Laparoscopic Cholecystectomy',
    cnp: '2660528345678',
    phoneNumber: '0733 456 789',
    bloodType: 'AB+',
  },
  {
    id: 'p6',
    name: 'Vasile Georgescu',
    initials: 'VG',
    age: 45,
    gender: 'M',
    bedNumber: '06',
    status: 'stable',
    sepsisRiskScore: 12,
    aiInsight: 'Low risk. Post-operative recovery proceeding normally. Patient ambulatory.',
    admissionDate: '2024-03-29',
    diagnosis: 'Rotator Cuff Tear - Post Arthroscopic Repair',
    attendingPhysician: 'Dr. Cristina Popa',
    vitals: {
      heartRate: 70,
      temperature: 36.7,
      bloodPressure: '125/82',
      oxygenSaturation: 99,
      respiratoryRate: 14,
    },
    medicalHistory: [
      { id: 'h20', type: 'admission', title: 'Day Surgery Admission', description: 'Admitted for rotator cuff repair', date: '2024-03-29', time: '06:30' },
      { id: 'h21', type: 'surgery', title: 'Arthroscopic Repair', description: 'Right rotator cuff repair completed', date: '2024-03-29', time: '08:00' },
    ],
    performedSurgery: 'Rotator Cuff Repair',
  },
  {
    id: 'p7',
    name: 'Ana Cristea',
    initials: 'AC',
    age: 39,
    gender: 'F',
    bedNumber: '07',
    status: 'stable',
    sepsisRiskScore: 8,
    aiInsight: 'Very low risk. Routine post-cesarean recovery. Mother and baby doing well.',
    admissionDate: '2024-03-30',
    diagnosis: 'Post Cesarean Section - Uncomplicated',
    attendingPhysician: 'Dr. Ioana Marinescu',
    vitals: {
      heartRate: 76,
      temperature: 36.8,
      bloodPressure: '115/75',
      oxygenSaturation: 98,
      respiratoryRate: 16,
    },
    medicalHistory: [
      { id: 'h22', type: 'admission', title: 'Labor & Delivery Admission', description: 'Admitted in active labor', date: '2024-03-30', time: '02:00' },
      { id: 'h23', type: 'surgery', title: 'Cesarean Section', description: 'Emergency C-section for fetal distress', date: '2024-03-30', time: '04:30' },
      { id: 'h24', type: 'observation', title: 'Recovery', description: 'Mother and baby stable, transferred to ward', date: '2024-03-30', time: '07:00' },
    ],
    performedSurgery: 'Cesarean Section',
  },
  {
    id: 'p8',
    name: 'Dumitru Moldovan',
    initials: 'DM',
    age: 73,
    gender: 'M',
    bedNumber: '08',
    status: 'stable',
    sepsisRiskScore: 25,
    aiInsight: 'Moderate baseline risk due to age and diabetes. Current parameters acceptable.',
    admissionDate: '2024-03-27',
    diagnosis: 'Diabetic Foot Ulcer - Post Debridement',
    attendingPhysician: 'Dr. Stefan Rusu',
    vitals: {
      heartRate: 80,
      temperature: 37.0,
      bloodPressure: '135/88',
      oxygenSaturation: 96,
      respiratoryRate: 17,
    },
    medicalHistory: [
      { id: 'h25', type: 'admission', title: 'Admission', description: 'Admitted for diabetic foot ulcer management', date: '2024-03-27', time: '10:00' },
      { id: 'h26', type: 'surgery', title: 'Wound Debridement', description: 'Surgical debridement of necrotic tissue', date: '2024-03-27', time: '14:00' },
      { id: 'h27', type: 'medication', title: 'Antibiotic Therapy', description: 'Vancomycin + Meropenem started', date: '2024-03-27', time: '15:00' },
    ],
  },
  {
    id: 'p9',
    name: 'Florina Dinu',
    initials: 'FD',
    age: 51,
    gender: 'F',
    bedNumber: '09',
    status: 'stable',
    sepsisRiskScore: 14,
    aiInsight: 'Low risk profile. Responding well to treatment. Continue current management.',
    admissionDate: '2024-03-29',
    diagnosis: 'Acute Pancreatitis - Mild',
    attendingPhysician: 'Dr. Bogdan Florescu',
    vitals: {
      heartRate: 74,
      temperature: 36.9,
      bloodPressure: '122/78',
      oxygenSaturation: 97,
      respiratoryRate: 15,
    },
    medicalHistory: [
      { id: 'h28', type: 'admission', title: 'ER Admission', description: 'Admitted with epigastric pain', date: '2024-03-29', time: '11:00' },
      { id: 'h29', type: 'lab', title: 'Lipase Test', description: 'Lipase elevated at 890 U/L', date: '2024-03-29', time: '11:30' },
      { id: 'h30', type: 'medication', title: 'NPO + IV Fluids', description: 'Started aggressive IV hydration', date: '2024-03-29', time: '12:00' },
    ],
  },
  {
    id: 'p10',
    name: 'Constantin Barbu',
    initials: 'CB',
    age: 66,
    gender: 'M',
    bedNumber: '10',
    status: 'stable',
    sepsisRiskScore: 20,
    aiInsight: 'Post-op day 1 from hip replacement. Pain well controlled. Monitor for DVT.',
    admissionDate: '2024-03-30',
    diagnosis: 'Osteoarthritis - Post Total Hip Replacement',
    attendingPhysician: 'Dr. Laura Nistor',
    vitals: {
      heartRate: 75,
      temperature: 37.1,
      bloodPressure: '128/82',
      oxygenSaturation: 97,
      respiratoryRate: 16,
    },
    medicalHistory: [
      { id: 'h31', type: 'admission', title: 'Elective Admission', description: 'Admitted for hip replacement', date: '2024-03-30', time: '06:00' },
      { id: 'h32', type: 'surgery', title: 'Total Hip Replacement', description: 'Right total hip arthroplasty', date: '2024-03-30', time: '08:00' },
      { id: 'h33', type: 'medication', title: 'DVT Prophylaxis', description: 'Enoxaparin 40mg SC started', date: '2024-03-30', time: '20:00' },
    ],
    performedSurgery: 'Hip Replacement',
  },
  {
    id: 'p11',
    name: 'Adriana Preda',
    initials: 'AP',
    age: 48,
    gender: 'F',
    bedNumber: '11',
    status: 'stable',
    sepsisRiskScore: 10,
    aiInsight: 'Low risk. Scheduled for discharge tomorrow pending final labs.',
    admissionDate: '2024-03-28',
    diagnosis: 'Thyroid Nodule - Post Thyroidectomy',
    attendingPhysician: 'Dr. Carmen Stoica',
    vitals: {
      heartRate: 68,
      temperature: 36.6,
      bloodPressure: '118/74',
      oxygenSaturation: 99,
      respiratoryRate: 14,
    },
    medicalHistory: [
      { id: 'h34', type: 'admission', title: 'Surgical Admission', description: 'Admitted for thyroidectomy', date: '2024-03-28', time: '06:00' },
      { id: 'h35', type: 'surgery', title: 'Total Thyroidectomy', description: 'Total thyroidectomy for suspicious nodule', date: '2024-03-28', time: '08:30' },
      { id: 'h36', type: 'lab', title: 'Calcium Check', description: 'Calcium levels normal at 9.2 mg/dL', date: '2024-03-29', time: '06:00' },
    ],
    performedSurgery: 'Thyroidectomy',
  },
  {
    id: 'p12',
    name: 'Radu Toma',
    initials: 'RT',
    age: 55,
    gender: 'M',
    bedNumber: '12',
    status: 'stable',
    sepsisRiskScore: 16,
    aiInsight: 'Stable post-stent placement. Cardiac markers trending down. Continue monitoring.',
    admissionDate: '2024-03-29',
    diagnosis: 'Acute STEMI - Post PCI with Stent',
    attendingPhysician: 'Dr. Alexandru Ionescu',
    vitals: {
      heartRate: 72,
      temperature: 36.8,
      bloodPressure: '124/80',
      oxygenSaturation: 98,
      respiratoryRate: 15,
    },
    medicalHistory: [
      { id: 'h37', type: 'admission', title: 'Emergency Admission', description: 'Admitted via ER with chest pain - STEMI', date: '2024-03-29', time: '08:00' },
      { id: 'h38', type: 'surgery', title: 'PCI with Stent', description: 'Primary PCI to LAD with drug-eluting stent', date: '2024-03-29', time: '09:30' },
      { id: 'h39', type: 'lab', title: 'Troponin Peak', description: 'Troponin peaked at 8.5 ng/mL', date: '2024-03-29', time: '18:00' },
      { id: 'h40', type: 'medication', title: 'DAPT Started', description: 'Aspirin + Ticagrelor initiated', date: '2024-03-29', time: '11:00' },
    ],
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    patientId: 'p4',
    patientName: 'Ion Popescu',
    bedNumber: '04',
    ward: 'Ward A',
    type: 'critical',
    message: 'SEPSIS ALERT: Risk score 87%. Immediate intervention required.',
    timestamp: '2024-03-30T14:30:00',
    isRead: false,
  },
  {
    id: 'a2',
    patientId: 'p5',
    patientName: 'Maria Ionescu',
    bedNumber: '05',
    ward: 'Ward A',
    type: 'warning',
    message: 'Elevated temperature detected. Sepsis risk score increased to 52%.',
    timestamp: '2024-03-30T13:45:00',
    isRead: false,
  },
  {
    id: 'a3',
    patientId: 'p4',
    patientName: 'Ion Popescu',
    bedNumber: '04',
    ward: 'Ward A',
    type: 'critical',
    message: 'Tachycardia alert: Heart rate sustained above 110 bpm.',
    timestamp: '2024-03-30T12:15:00',
    isRead: true,
  },
  {
    id: 'a4',
    patientId: 'p5',
    patientName: 'Maria Ionescu',
    bedNumber: '05',
    ward: 'Ward A',
    type: 'warning',
    message: 'Blood culture results pending. Monitor for changes.',
    timestamp: '2024-03-30T10:00:00',
    isRead: true,
  },
  {
    id: 'a5',
    patientId: 'p2',
    patientName: 'Elena Dumitrescu',
    bedNumber: '02',
    ward: 'Ward A',
    type: 'info',
    message: 'WBC trending down. Antibiotic therapy effective.',
    timestamp: '2024-03-30T08:30:00',
    isRead: true,
  },
];

// Vitals history for charts
export const VITALS_HISTORY = {
  heartRate: [
    { time: '00:00', value: 72 },
    { time: '02:00', value: 75 },
    { time: '04:00', value: 78 },
    { time: '06:00', value: 82 },
    { time: '08:00', value: 88 },
    { time: '10:00', value: 95 },
    { time: '12:00', value: 102 },
    { time: '14:00', value: 112 },
  ],
  temperature: [
    { time: '00:00', value: 37.2 },
    { time: '02:00', value: 37.5 },
    { time: '04:00', value: 37.8 },
    { time: '06:00', value: 38.1 },
    { time: '08:00', value: 38.4 },
    { time: '10:00', value: 38.7 },
    { time: '12:00', value: 38.9 },
    { time: '14:00', value: 38.9 },
  ],
  bloodPressure: [
    { time: '00:00', systolic: 110, diastolic: 70 },
    { time: '02:00', systolic: 108, diastolic: 68 },
    { time: '04:00', systolic: 105, diastolic: 65 },
    { time: '06:00', systolic: 100, diastolic: 62 },
    { time: '08:00', systolic: 98, diastolic: 60 },
    { time: '10:00', systolic: 96, diastolic: 58 },
    { time: '12:00', systolic: 95, diastolic: 58 },
    { time: '14:00', systolic: 95, diastolic: 60 },
  ],
};

export const WARD_RISK_DISTRIBUTION = [
  { ward: 'Ward A', low: 8, moderate: 2, high: 1, critical: 1 },
  { ward: 'Ward B', low: 10, moderate: 1, high: 1, critical: 0 },
  { ward: 'Ward C', low: 7, moderate: 3, high: 2, critical: 0 },
  { ward: 'Ward D', low: 9, moderate: 2, high: 0, critical: 1 },
];
