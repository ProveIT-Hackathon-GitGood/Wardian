'use client';

import {useState, useCallback, useRef, use} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/main-layout';
import { ArrowLeft,
    Activity,
    Brain,
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    FileText,
    Heart,
    Pencil,
    Pill,
    Plus,
    Printer,
    Stethoscope,
    TestTube,
    Thermometer,
    Trash2,
    Upload,
    User,
    Wind,
    X,
    Zap,
} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import {SURGERY_OPTIONS, BLOOD_TYPE_OPTIONS, type Patient, type HistoryEvent} from '@/lib/mock-data';
import {useDashboard} from '@/lib/dashboard-context';
import {useDropzone} from 'react-dropzone';
import {uploadPatientFile} from '@/lib/api/services/patients';
import {apiPost, apiUpload} from '@/lib/api/client';
import {AIChatPanel} from "@/components/dashboard/ai-chat";

const VITAL_SIGNS_OPTIONS = [
    'HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2',
    'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
    'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
    'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium', 'Bilirubin_total',
    'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC', 'Fibrinogen', 'Platelets',
    'HospAdmTime', 'ICULOS'
];

export default function PatientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { patients } = useDashboard();
    const patientId = id.startsWith('patient-') ? id : 'patient-' + id;
    const patient = patients.find(p => p.id === patientId || p.backendId?.toString() === id);

    if (!patient) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center p-12 h-full text-muted-foreground">
                    Patient not found based on ID: {id}
                </div>
            </MainLayout>
        );
    }

    return <PatientDossierView patient={patient} />;
}

function PatientDossierView({ patient }: { patient: Patient }) {
    const router = useRouter();
    const {updatePatient, addHistoryEvent} = useDashboard();
    const [selectedSurgery, setSelectedSurgery] = useState(patient.performedSurgery || '');
    const [clinicalObservations, setClinicalObservations] = useState(
        patient.clinicalObservations || ''
    );
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [vitalSigns, setVitalSigns] = useState<{name: string, value: string}[]>([]);
    const [entrySaved, setEntrySaved] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const ocrFileInputRef = useRef<HTMLInputElement>(null);

    const [patientReports, setPatientReports] = useState<{
        id: string;
        label: string;
        timestamp: string;
        url: string
    }[]>([]);
    const [isGeneratingPatientReport, setIsGeneratingPatientReport] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: patient.name,
        age: String(patient.age),
        gender: patient.gender as 'M' | 'F',
        cnp: patient.cnp || '',
        phoneNumber: patient.phoneNumber || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        bloodType: patient.bloodType || '',
        allergies: patient.allergies || '',
        diagnosis: patient.diagnosis,
        attendingPhysician: patient.attendingPhysician,
        admissionDate: patient.admissionDate,
    });

    const handleStartEdit = () => {
        setEditForm({
            name: patient.name,
            age: String(patient.age),
            gender: patient.gender,
            cnp: patient.cnp || '',
            phoneNumber: patient.phoneNumber || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactPhone: patient.emergencyContactPhone || '',
            bloodType: patient.bloodType || '',
            allergies: patient.allergies || '',
            diagnosis: patient.diagnosis,
            attendingPhysician: patient.attendingPhysician,
            admissionDate: patient.admissionDate,
        });
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        updatePatient(patient.id, {
            name: editForm.name.trim(),
            age: parseInt(editForm.age, 10) || patient.age,
            gender: editForm.gender,
            cnp: editForm.cnp.trim() || undefined,
            phoneNumber: editForm.phoneNumber.trim() || undefined,
            emergencyContactName: editForm.emergencyContactName.trim() || undefined,
            emergencyContactPhone: editForm.emergencyContactPhone.trim() || undefined,
            bloodType: editForm.bloodType || undefined,
            allergies: editForm.allergies.trim() || undefined,
            diagnosis: editForm.diagnosis.trim(),
            attendingPhysician: editForm.attendingPhysician.trim(),
            admissionDate: editForm.admissionDate,
        });
        setIsEditing(false);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
    });

    // ─── OCR Vitals Scan Handler ───
    const handleOcrUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so re-selecting the same file works
        e.target.value = '';

        setIsScanning(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await apiUpload<{ status: string; data?: Record<string, number>; message?: string }>(
                '/api/v1/ai/ocr-vitals',
                formData,
                true
            );

            if (result.status === 'success' && result.data) {
                // Map OCR keys (case-insensitive) to VITAL_SIGNS_OPTIONS
                const ocrEntries = Object.entries(result.data);
                const newVitals: { name: string; value: string }[] = [];

                for (const [rawKey, rawValue] of ocrEntries) {
                    const matchedOption = VITAL_SIGNS_OPTIONS.find(
                        (opt) => opt.toLowerCase() === rawKey.toLowerCase()
                    );
                    if (matchedOption) {
                        newVitals.push({ name: matchedOption, value: String(rawValue) });
                    }
                }

                if (newVitals.length > 0) {
                    // Merge: update existing entries by name, add new ones
                    setVitalSigns((prev) => {
                        const updated = [...prev];
                        for (const nv of newVitals) {
                            const existingIdx = updated.findIndex((v) => v.name === nv.name);
                            if (existingIdx >= 0) {
                                updated[existingIdx].value = nv.value;
                            } else {
                                updated.push(nv);
                            }
                        }
                        return updated;
                    });
                    toast.success(`Scanned ${newVitals.length} vital sign${newVitals.length > 1 ? 's' : ''} from image`);
                } else {
                    toast.info('No recognized vital signs found in the image');
                }
            } else {
                toast.error(result.message || 'Failed to extract vitals from image');
            }
        } catch (err) {
            console.error('OCR vitals error:', err);
            toast.error('Failed to scan vitals from image');
        } finally {
            setIsScanning(false);
        }
    }, []);

    const handleSaveEntry = async () => {
        const hasSurgery = !!selectedSurgery;
        const hasObs = !!clinicalObservations.trim();
        const hasFiles = uploadedFiles.length > 0;
        const validVitals = vitalSigns.filter(v => v.name && v.value.trim());
        const hasVitals = validVitals.length > 0;
        
        if (!hasSurgery && !hasObs && !hasFiles && !hasVitals) return;

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);

        const parts: string[] = [];
        if (hasSurgery) parts.push(`Surgery: ${selectedSurgery}`);
        if (hasVitals) parts.push(`Vital Signs/Labs updated (${validVitals.length} values)`);
        if (hasObs) parts.push(clinicalObservations.trim().slice(0, 100) + (clinicalObservations.trim().length > 100 ? '...' : ''));
        if (hasFiles) parts.push(`${uploadedFiles.length} file(s) attached`);

        const type = hasSurgery ? 'surgery' as const : hasFiles ? 'lab' as const : hasVitals ? 'observation' as const : 'observation' as const;
        const title = hasSurgery ? selectedSurgery : hasFiles ? 'Lab Results' : hasVitals ? 'Vital Signs & Labs' : 'Clinical Observation';

        try {
            const uploadedAttachments = [];
            if (hasFiles) {
                for (const file of uploadedFiles) {
                    const result = await uploadPatientFile(file);
                    uploadedAttachments.push({
                        name: result.filename,
                        url: result.url
                    });
                }
            }

            let combinedDetails = '';
            if (hasVitals) {
                combinedDetails += `Recorded Values:\n` + validVitals.map(v => `${v.name}: ${v.value}`).join('\n') + '\n\n';
            }
            if (hasObs) {
                combinedDetails += `Notes:\n${clinicalObservations.trim()}`;
            }

            const entry: Omit<import('@/lib/mock-data').HistoryEvent, 'id'> = {
                type,
                title,
                description: parts.join(' — '),
                date,
                time,
                surgeryType: hasSurgery ? selectedSurgery : undefined,
                details: combinedDetails.trim() || undefined,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            };

            await addHistoryEvent(patient.id, entry);
            // After saving the event, update the patient model's high-level fields if needed locally
            updatePatient(patient.id, {
                performedSurgery: selectedSurgery || patient.performedSurgery,
                clinicalObservations: clinicalObservations || patient.clinicalObservations,
            });
            toast.success('Medical history entry saved successfully');

            // If vitals were entered, call the prediction endpoint
            if (hasVitals && patient.backendId) {
                try {
                    const vitalsPayload: Record<string, number> = {};
                    for (const v of validVitals) {
                        vitalsPayload[v.name] = parseFloat(v.value);
                    }
                    const prediction = await apiPost<{
                        current_probability: number;
                        previous_probability: number;
                        risk_delta: number;
                        risk_trend: string;
                        is_sepsis_alert: boolean;
                        top_drivers: { feature: string; shap_impact: number; direction: string }[];
                    }>(`/api/v1/predict/${patient.backendId}/risk-update`, { vitals: vitalsPayload }, true);

                    const scorePercent = Math.round(prediction.current_probability * 100);
                    updatePatient(patient.id, {
                        sepsisRiskScore: scorePercent,
                        aiInsight: `Risk ${prediction.risk_trend.toLowerCase()}. Top driver: ${prediction.top_drivers?.[0]?.feature ?? 'N/A'} (${prediction.top_drivers?.[0]?.direction ?? ''}).`,
                    });

                    if (prediction.is_sepsis_alert) {
                        toast.error(`⚠️ SEPSIS ALERT — Risk score: ${scorePercent}%`, { duration: 8000 });
                    } else {
                        toast.success(`Sepsis risk updated: ${scorePercent}%`);
                    }
                } catch (predError) {
                    console.error('Prediction failed (vitals still saved):', predError);
                    toast.error('Vitals saved, but risk prediction failed.');
                }
            }
        } catch (error) {
            console.error('Failed to add medical history', error);
            toast.error('Failed to save medical history entry');
            return;
        }
        setSelectedSurgery('');
        setClinicalObservations('');
        setUploadedFiles([]);
        setVitalSigns([]);
        setEntrySaved(true);
        setTimeout(() => setEntrySaved(false), 2000);
    };



    const handleGeneratePatientReport = async () => {
        setIsGeneratingPatientReport(true);
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const {jsPDF} = await import('jspdf');
        const doc = new jsPDF({unit: 'mm', format: 'a4'});
        const pw = doc.internal.pageSize.getWidth();
        const m = 18;
        let y = 20;

        const checkPage = (needed: number) => {
            if (y + needed > 275) {
                doc.addPage();
                y = 20;
            }
        };

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text('Patient Report', m, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()}`, m, y);
        doc.text('Wardian Hospital Management System', pw - m, y, {align: 'right'});
        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(m, y, pw - m, y);
        y += 8;

        // Patient info
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text(patient.name, m, y);

        const statusLabel = patient.status.charAt(0).toUpperCase() + patient.status.slice(1);
        const sColor = patient.status === 'critical' ? [220, 38, 38] : patient.status === 'warning' ? [217, 119, 6] : [5, 150, 105];
        doc.setFontSize(9);
        doc.setTextColor(sColor[0], sColor[1], sColor[2]);
        doc.text(`${statusLabel} — Sepsis Risk: ${patient.sepsisRiskScore}%`, pw - m, y, {align: 'right'});
        y += 8;

        // Info grid
        doc.setFontSize(9);
        const infoRows = [
            ['Age / Gender', `${patient.age} y/o ${patient.gender === 'M' ? 'Male' : 'Female'}`, 'Bed', patient.bedNumber],
            ['Diagnosis', patient.diagnosis, 'Attending', patient.attendingPhysician],
            ['Admission Date', patient.admissionDate, 'Blood Type', patient.bloodType || 'N/A'],
            ['CNP', patient.cnp || 'N/A', 'Phone', patient.phoneNumber || 'N/A'],
            ['Emergency Contact', patient.emergencyContactName || 'N/A', 'Emergency Phone', patient.emergencyContactPhone || 'N/A'],
            ['Allergies', patient.allergies || 'None reported', '', ''],
        ];

        for (const row of infoRows) {
            checkPage(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(row[0], m, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            doc.text(row[1], m + 35, y, {maxWidth: 50});
            if (row[2]) {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 116, 139);
                doc.text(row[2], pw / 2 + 5, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                doc.text(row[3], pw / 2 + 40, y, {maxWidth: 50});
            }
            y += 6;
        }
        y += 4;

        // Current vitals
        checkPage(20);
        doc.setDrawColor(226, 232, 240);
        doc.line(m, y, pw - m, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text('Current Vitals', m, y);
        y += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const vitals = [
            `Heart Rate: ${patient.vitals.heartRate} bpm`,
            `Temperature: ${patient.vitals.temperature.toFixed(1)}°C`,
            `Blood Pressure: ${patient.vitals.bloodPressure}`,
            `SpO2: ${patient.vitals.oxygenSaturation}%`,
            `Respiratory Rate: ${patient.vitals.respiratoryRate} /min`,
        ];
        const vColW = (pw - m * 2) / 3;
        for (let i = 0; i < vitals.length; i++) {
            const col = i % 3;
            if (i > 0 && col === 0) y += 6;
            doc.text(vitals[i], m + col * vColW, y);
        }
        y += 10;

        // AI Insight
        if (patient.aiInsight) {
            checkPage(20);
            doc.setFillColor(241, 245, 249);
            const insightLines = doc.splitTextToSize(patient.aiInsight, pw - m * 2 - 8);
            doc.roundedRect(m, y - 3, pw - m * 2, insightLines.length * 4.5 + 10, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 58, 95);
            doc.text('AI Insight', m + 4, y + 2);
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(insightLines, m + 4, y);
            y += insightLines.length * 4.5 + 6;
        }

        // Medical history
        checkPage(15);
        doc.setDrawColor(226, 232, 240);
        doc.line(m, y, pw - m, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text(`Medical History (${patient.medicalHistory.length} events)`, m, y);
        y += 8;

        if (patient.medicalHistory.length === 0) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No medical history entries recorded.', m, y);
        } else {
            for (const event of patient.medicalHistory) {
                checkPage(20);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`${event.date} ${event.time}`, m, y);
                doc.setTextColor(30, 58, 95);
                doc.text(`${event.title} [${event.type}]`, m + 30, y);
                y += 5;

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                const descLines = doc.splitTextToSize(event.description, pw - m * 2 - 30);
                doc.text(descLines, m + 30, y);
                y += descLines.length * 4.5;

                if (event.details) {
                    const detLines = doc.splitTextToSize(`Notes: ${event.details}`, pw - m * 2 - 30);
                    doc.setTextColor(100, 116, 139);
                    doc.text(detLines, m + 30, y);
                    y += detLines.length * 4.5;
                }
                if (event.surgeryType) {
                    doc.setTextColor(100, 116, 139);
                    doc.text(`Surgery: ${event.surgeryType}`, m + 30, y);
                    y += 5;
                }
                if (event.attachments && event.attachments.length > 0) {
                    doc.setTextColor(100, 116, 139);
                    doc.text(`Attachments: ${event.attachments.map(a => a.name).join(', ')}`, m + 30, y);
                    y += 5;
                }
                y += 3;
            }
        }

        // Footer on all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('Wardian — Confidential Patient Report', m, 290);
            doc.text(`Page ${i} of ${totalPages}`, pw - m, 290, {align: 'right'});
        }

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const now = new Date();

        // 1. Persist the report to the server
        try {
            const fileName = `wardian-report-${patient.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });
            
            const uploadResult = await uploadPatientFile(file);
            
            // 2. Add to Medical History
            await addHistoryEvent(patient.id, {
                type: 'observation',
                title: 'Comprehensive Patient Report Generated',
                description: `A full medical report was generated and saved to the repository.`,
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().slice(0, 5),
                attachments: [{
                    name: fileName,
                    url: uploadResult.url
                }]
            });
            
            toast.success('Report generated and saved to history');
            
            // 3. Update the local reports list
            setPatientReports(prev => [{
                id: `pr-${Date.now()}`,
                label: `Report — ${now.toLocaleDateString()}`,
                timestamp: now.toLocaleString(),
                url: uploadResult.url, // Use the server URL
            }, ...prev]);

        } catch (error) {
            console.error('Failed to save report to server', error);
            toast.error('Report generated locally but failed to save to server');
            
            // Fallback: still show it locally
            setPatientReports(prev => [{
                id: `pr-${Date.now()}`,
                label: `Report — ${now.toLocaleDateString()} (Local only)`,
                timestamp: now.toLocaleString(),
                url,
            }, ...prev]);
        }

        setIsGeneratingPatientReport(false);
    };

    const handleDownloadPatientReport = (report: { url: string; label: string; id: string }) => {
        const a = document.createElement('a');
        a.href = report.url;
        a.download = `wardian-${patient.name.replace(/\s+/g, '-').toLowerCase()}-${report.id}.pdf`;
        a.click();
    };

    const handleDeletePatientReport = (id: string) => {
        setPatientReports(prev => {
            const target = prev.find(r => r.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter(r => r.id !== id);
        });
    };

    const statusConfig = {
        stable: {
            label: 'Stable',
            color: 'bg-success/10 text-success border-success/30',
        },
        warning: {
            label: 'Warning - Monitoring',
            color: 'bg-warning/10 text-warning border-warning/30',
        },
        critical: {
            label: 'Critical Sepsis Risk',
            color: 'bg-critical/10 text-critical border-critical/30',
        },
    };

    return (
        <MainLayout>
            <div className="flex flex-col h-full bg-card">
                <div className="px-5 py-3 border-b border-border flex items-center gap-4 sticky top-0 bg-background z-20">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                                {
                                    'bg-success/10 text-success': patient.status === 'stable',
                                    'bg-warning/10 text-warning': patient.status === 'warning',
                                    'bg-critical/10 text-critical': patient.status === 'critical',
                                }
                            )}
                        >
                            {patient.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-semibold leading-tight"
                                         style={{fontFamily: 'var(--font-heading)'}}>{patient.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {patient.age} y/o {patient.gender === 'M' ? 'Male' : 'Female'}
                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                  Bed {patient.bedNumber}
                </span>
                                <Badge variant="outline"
                                       className={cn('text-[10px] px-1.5 py-0', statusConfig[patient.status].color)}>
                                    {statusConfig[patient.status].label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 pb-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="input">Data Input</TabsTrigger>
                                <TabsTrigger value="history">Medical History</TabsTrigger>
                                <TabsTrigger value="reports">Reports</TabsTrigger>
                                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-4">
                                {/* Sepsis AI Panel */}
                                <Card
                                    className={cn('border-2', {
                                        'border-critical/50 bg-critical/5': patient.status === 'critical',
                                        'border-warning/50 bg-warning/5': patient.status === 'warning',
                                        'border-success/50 bg-success/5': patient.status === 'stable',
                                    })}
                                >
                                    <CardHeader className="px-4 pt-3 pb-1">
                                        <CardTitle
                                            className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                                            <Brain className="w-3 h-3 text-primary"/>
                                            Sepsis AI Panel
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-full h-full transform -rotate-90"
                                                         viewBox="0 0 100 100">
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="42"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            className="text-muted"
                                                        />
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="42"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            strokeDasharray={`${(patient.sepsisRiskScore / 100) * 264} 264`}
                                                            strokeLinecap="round"
                                                            className={cn({
                                                                'text-success': patient.sepsisRiskScore < 30,
                                                                'text-warning':
                                                                    patient.sepsisRiskScore >= 30 && patient.sepsisRiskScore < 70,
                                                                'text-critical': patient.sepsisRiskScore >= 70,
                                                            })}
                                                        />
                                                    </svg>
                                                    <div
                                                        className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                className={cn('text-xl font-bold leading-none', {
                                    'text-success': patient.sepsisRiskScore < 30,
                                    'text-warning':
                                        patient.sepsisRiskScore >= 30 && patient.sepsisRiskScore < 70,
                                    'text-critical': patient.sepsisRiskScore >= 70,
                                })}
                            >
                              {patient.sepsisRiskScore}%
                            </span>
                                                        <span className="text-[11px] text-muted-foreground mt-0.5">Risk Score</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <Zap className="w-3 h-3 text-primary"/>
                                                    <span className="text-[11px] font-semibold text-foreground">AI Insight</span>
                                                </div>
                                                <div
                                                    className={cn('px-3 py-2 rounded-md border', {
                                                        'bg-critical/10 border-critical/30':
                                                            patient.status === 'critical',
                                                        'bg-warning/10 border-warning/30': patient.status === 'warning',
                                                        'bg-success/10 border-success/30': patient.status === 'stable',
                                                    })}
                                                >
                                                    <p className="text-xs text-foreground leading-relaxed">
                                                        {patient.aiInsight}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Current Vitals */}
                                <Card>
                                    <CardHeader className="px-3 pt-2.5 pb-1">
                                        <CardTitle
                                            className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                                            <Activity className="w-3 h-3"/>
                                            Current Vitals
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-2.5">
                                        <div className="grid grid-cols-4 gap-2">
                                            <VitalDisplay
                                                icon={<Heart className="w-3 h-3"/>}
                                                label="Heart Rate"
                                                value={`${patient.vitals.heartRate} bpm`}
                                                isAbnormal={
                                                    patient.vitals.heartRate > 100 || patient.vitals.heartRate < 60
                                                }
                                            />
                                            <VitalDisplay
                                                icon={<Thermometer className="w-3 h-3"/>}
                                                label="Temperature"
                                                value={`${patient.vitals.temperature.toFixed(1)}°C`}
                                                isAbnormal={patient.vitals.temperature > 38}
                                            />
                                            <VitalDisplay
                                                icon={<Activity className="w-3 h-3"/>}
                                                label="Blood Pressure"
                                                value={patient.vitals.bloodPressure}
                                                isAbnormal={false}
                                            />
                                            <VitalDisplay
                                                icon={<Wind className="w-3 h-3"/>}
                                                label="SpO2"
                                                value={`${patient.vitals.oxygenSaturation}%`}
                                                isAbnormal={patient.vitals.oxygenSaturation < 95}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Patient Information (full width below vitals) */}
                                <Card>
                                    <CardHeader className="px-3 pt-2.5 pb-1">
                                        <div className="flex items-center justify-between">
                                            <CardTitle
                                                className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                                                <User className="w-3 h-3"/>
                                                Patient Information
                                            </CardTitle>
                                            {!isEditing ? (
                                                <button onClick={handleStartEdit}
                                                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                                    <Pencil className="w-3 h-3"/> Edit
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setIsEditing(false)}
                                                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button onClick={handleSaveEdit}
                                                            className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 transition-colors">
                                                        <Check className="w-3 h-3"/> Save
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-2.5">
                                        {isEditing ? (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                <EditField label="Name" value={editForm.name}
                                                           onChange={(v) => setEditForm(f => ({...f, name: v}))}/>
                                                <EditField label="CNP" value={editForm.cnp}
                                                           onChange={(v) => setEditForm(f => ({...f, cnp: v}))}
                                                           maxLength={13}/>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <EditField label="Age" value={editForm.age}
                                                               onChange={(v) => setEditForm(f => ({...f, age: v}))}
                                                               type="number"/>
                                                    <div>
                                                        <span
                                                            className="text-[9px] text-muted-foreground leading-none">Gender</span>
                                                        <Select value={editForm.gender}
                                                                onValueChange={(v) => setEditForm(f => ({
                                                                    ...f,
                                                                    gender: v as 'M' | 'F'
                                                                }))}>
                                                            <SelectTrigger
                                                                className="h-[24px] text-[11px] mt-0.5 px-1.5"><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="M">M</SelectItem>
                                                                <SelectItem value="F">F</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <span
                                                            className="text-[9px] text-muted-foreground leading-none">Blood</span>
                                                        <Select value={editForm.bloodType}
                                                                onValueChange={(v) => setEditForm(f => ({
                                                                    ...f,
                                                                    bloodType: v
                                                                }))}>
                                                            <SelectTrigger
                                                                className="h-[24px] text-[11px] mt-0.5 px-1.5"><SelectValue
                                                                placeholder="-"/></SelectTrigger>
                                                            <SelectContent>
                                                                {BLOOD_TYPE_OPTIONS.map((bt) => <SelectItem key={bt}
                                                                                                            value={bt}>{bt}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <EditField label="Phone" value={editForm.phoneNumber}
                                                           onChange={(v) => setEditForm(f => ({
                                                               ...f,
                                                               phoneNumber: v
                                                           }))}/>
                                                <EditField label="Diagnosis" value={editForm.diagnosis}
                                                           onChange={(v) => setEditForm(f => ({...f, diagnosis: v}))}/>
                                                <EditField label="Attending" value={editForm.attendingPhysician}
                                                           onChange={(v) => setEditForm(f => ({
                                                               ...f,
                                                               attendingPhysician: v
                                                           }))}/>
                                                <EditField label="Admission" value={editForm.admissionDate}
                                                           onChange={(v) => setEditForm(f => ({
                                                               ...f,
                                                               admissionDate: v
                                                           }))} type="date"/>
                                                <EditField label="Allergies" value={editForm.allergies}
                                                           onChange={(v) => setEditForm(f => ({...f, allergies: v}))}/>
                                                <EditField label="Emergency Name" value={editForm.emergencyContactName}
                                                           onChange={(v) => setEditForm(f => ({
                                                               ...f,
                                                               emergencyContactName: v
                                                           }))}/>
                                                <EditField label="Emergency Phone"
                                                           value={editForm.emergencyContactPhone}
                                                           onChange={(v) => setEditForm(f => ({
                                                               ...f,
                                                               emergencyContactPhone: v
                                                           }))}/>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                                                <InfoRow label="Diagnosis" value={patient.diagnosis}/>
                                                <InfoRow label="Attending" value={patient.attendingPhysician}/>
                                                <InfoRow label="Admission" value={patient.admissionDate}/>
                                                {patient.cnp ? <InfoRow label="CNP" value={patient.cnp}/> : <div/>}
                                                {patient.bloodType ?
                                                    <InfoRow label="Blood Type" value={patient.bloodType}/> : <div/>}
                                                {patient.phoneNumber ?
                                                    <InfoRow label="Phone" value={patient.phoneNumber}/> : <div/>}
                                                {patient.allergies ?
                                                    <InfoRow label="Allergies" value={patient.allergies}/> : <div/>}
                                                {patient.emergencyContactName ? (
                                                    <InfoRow label="Emergency"
                                                             value={`${patient.emergencyContactName}${patient.emergencyContactPhone ? ` (${patient.emergencyContactPhone})` : ''}`}/>
                                                ) : <div/>}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Data Input Tab */}
                            <TabsContent value="input" className="space-y-6">
                                {/* Surgery Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Stethoscope className="w-5 h-5"/>
                                            Performed Surgery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Select value={selectedSurgery} onValueChange={setSelectedSurgery}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select surgery type..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SURGERY_OPTIONS.map((surgery) => (
                                                    <SelectItem key={surgery} value={surgery}>
                                                        {surgery}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>

                                {/* Vital Signs */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Activity className="w-5 h-5"/>
                                                Vital Signs
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={ocrFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleOcrUpload}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs gap-1"
                                                    disabled={isScanning}
                                                    onClick={() => ocrFileInputRef.current?.click()}
                                                >
                                                    {isScanning ? (
                                                        <><span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Scanning…</>
                                                    ) : (
                                                        <><Upload className="w-3 h-3" /> Scan Vitals</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => setVitalSigns([...vitalSigns, {name: '', value: ''}])}
                                                >
                                                    <Plus className="w-3 h-3"/> Add
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {vitalSigns.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No vital signs added yet. Click Add to record new values.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {vitalSigns.map((vital, index) => (
                                                    <div key={index} className="flex flex-col sm:flex-row gap-2">
                                                        <div className="flex-1">
                                                            <Select
                                                                value={vital.name}
                                                                onValueChange={(val) => {
                                                                    const newVitals = [...vitalSigns];
                                                                    newVitals[index].name = val;
                                                                    setVitalSigns(newVitals);
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-full text-xs h-9">
                                                                    <SelectValue placeholder="Select vital sign..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {VITAL_SIGNS_OPTIONS.map((opt) => (
                                                                        <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex-1 flex gap-2">
                                                            <Input
                                                                placeholder="Value"
                                                                value={vital.value}
                                                                onChange={(e) => {
                                                                    const newVitals = [...vitalSigns];
                                                                    newVitals[index].value = e.target.value;
                                                                    setVitalSigns(newVitals);
                                                                }}
                                                                className="h-9 text-xs"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                                                onClick={() => {
                                                                    const newVitals = [...vitalSigns];
                                                                    newVitals.splice(index, 1);
                                                                    setVitalSigns(newVitals);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Clinical Observations */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5"/>
                                            Clinical Observations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Label htmlFor="observations" className="sr-only">
                                            Clinical Observations
                                        </Label>
                                        <Textarea
                                            id="observations"
                                            placeholder="Enter clinical observations, notes, or additional information..."
                                            value={clinicalObservations}
                                            onChange={(e) => setClinicalObservations(e.target.value)}
                                            rows={4}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Lab Upload */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TestTube className="w-5 h-5"/>
                                            Lab Results Upload
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            {...getRootProps()}
                                            className={cn(
                                                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                                                isDragActive
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                            )}
                                        >
                                            <input {...getInputProps()} />
                                            <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground"/>
                                            <p className="text-sm text-foreground font-medium">
                                                Drag & drop lab results here
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Supports PDF and Excel files
                                            </p>
                                        </div>

                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-primary"/>
                                                            <span className="text-sm text-foreground">{file.name}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
                                                            }
                                                        >
                                                            <X className="w-4 h-4"/>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Save Entry + Analysis */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveEntry}
                                        disabled={!selectedSurgery && !clinicalObservations.trim() && uploadedFiles.length === 0 && vitalSigns.filter(v => v.name && v.value.trim()).length === 0}
                                        className="flex-1 h-10 text-sm font-medium gap-2"
                                    >
                                        {entrySaved ? (
                                            <><Check className="w-4 h-4"/> Entry Saved</>
                                        ) : (
                                            <><Plus className="w-4 h-4"/> Save Entry to History</>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Medical History Tab */}
                            <TabsContent value="history">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5"/>
                                            Medical Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {patient.medicalHistory.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-6">No medical
                                                history entries yet. Add data via the Data Input tab.</p>
                                        ) : (
                                            <div className="relative">
                                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"/>
                                                <div className="space-y-6">
                                                    {patient.medicalHistory.map((event, index) => (
                                                        <TimelineEvent key={event.id} event={event}
                                                                       isLast={index === patient.medicalHistory.length - 1}/>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Reports Tab */}
                            <TabsContent value="reports" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2">
                                            <Printer className="w-5 h-5"/>
                                            Generate Patient Report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Generate a comprehensive PDF report containing patient information, current
                                            vitals, AI insights, and full medical history.
                                        </p>
                                        <Button
                                            onClick={handleGeneratePatientReport}
                                            disabled={isGeneratingPatientReport}
                                            className="w-full gap-2"
                                        >
                                            {isGeneratingPatientReport ? (
                                                <>
                                                    <span
                                                        className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"/>
                                                    Generating Report...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-4 h-4"/>
                                                    Generate PDF Report
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="w-5 h-5"/>
                                                Report History
                                            </CardTitle>
                                            {patientReports.length > 0 && (
                                                <Badge variant="outline"
                                                       className="text-xs">{patientReports.length}</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {patientReports.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-6">
                                                No reports generated yet. Use the button above to create one.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {patientReports.map((report) => (
                                                    <div
                                                        key={report.id}
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <FileText className="w-5 h-5 text-primary shrink-0"/>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{report.label}</p>
                                                            <p className="text-xs text-muted-foreground">{report.timestamp}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleDownloadPatientReport(report)}
                                                            >
                                                                <Download className="w-4 h-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleDeletePatientReport(report.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="assistant" className="space-y-3">
                                <AIChatPanel patient={patient}/>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </div>
        </MainLayout>
    );
}

function EditField({label, value, onChange, type = 'text', maxLength}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    maxLength?: number;
}) {
    return (
        <div>
            <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-[24px] text-[11px] mt-0.5 px-1.5"
                maxLength={maxLength}
            />
        </div>
    );
}

function InfoRow({label, value}: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
            <span className="text-xs text-foreground/75 text-right">{value}</span>
        </div>
    );
}

function VitalDisplay({
                          icon,
                          label,
                          value,
                          isAbnormal,
                      }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    isAbnormal: boolean;
}) {
    return (
        <div
            className={cn('px-2.5 py-2 rounded-md', isAbnormal ? 'bg-critical/10' : 'bg-muted')}
        >
            <div className="flex items-center gap-1.5 mb-0.5">
        <span className={isAbnormal ? 'text-critical' : 'text-muted-foreground'}>
          {icon}
        </span>
                <span className="text-[11px] text-muted-foreground leading-none">{label}</span>
            </div>
            <p className={cn('text-sm font-semibold', isAbnormal ? 'text-critical' : 'text-foreground')}>
                {value}
            </p>
        </div>
    );
}

function TimelineEvent({event, isLast}: { event: HistoryEvent; isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const hasExtra = !!(event.details || event.attachments?.length || event.surgeryType || event.analysisResult);

    const iconMap = {
        surgery: <Stethoscope className="w-3 h-3"/>,
        lab: <TestTube className="w-3 h-3"/>,
        medication: <Pill className="w-3 h-3"/>,
        admission: <User className="w-3 h-3"/>,
        observation: <FileText className="w-3 h-3"/>,
    };

    const colorMap = {
        surgery: 'bg-primary text-primary-foreground',
        lab: 'bg-chart-2 text-primary-foreground',
        medication: 'bg-chart-5 text-primary-foreground',
        admission: 'bg-chart-1 text-primary-foreground',
        observation: 'bg-muted-foreground text-background',
    };

    return (
        <div className="relative pl-10">
            <div
                className={cn(
                    'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2',
                    colorMap[event.type]
                )}
            >
                {iconMap[event.type]}
            </div>
            <div className={cn('pb-6', isLast && 'pb-0')}>
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-2 mb-1 text-left w-full',
                        hasExtra && 'cursor-pointer group'
                    )}
                    onClick={() => hasExtra && setExpanded(!expanded)}
                    disabled={!hasExtra}
                >
                    {hasExtra && (
                        expanded
                            ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0"/>
                            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0"/>
                    )}
                    <span className="text-xs font-medium text-foreground">{event.title}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1">
                        {event.type}
                    </Badge>
                </button>
                <p className="text-[11px] text-muted-foreground">{event.description}</p>

                {expanded && (
                    <div className="mt-2 p-2 bg-muted/50 rounded border border-border space-y-1.5">
                        {event.details && (
                            <div>
                                <span className="text-[10px] text-muted-foreground font-medium">Notes</span>
                                <p className="text-[11px] text-foreground/80 whitespace-pre-wrap">{event.details}</p>
                            </div>
                        )}
                        {event.surgeryType && (
                            <div>
                                <span className="text-[10px] text-muted-foreground font-medium">Surgery Type</span>
                                <p className="text-[11px] text-foreground/80">{event.surgeryType}</p>
                            </div>
                        )}
                        {event.attachments && event.attachments.length > 0 && (
                            <div>
                                <span className="text-[10px] text-muted-foreground font-medium">Attachments</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {event.attachments.map((file, i) => (
                                        <a
                                            key={i}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={file.name}
                                            className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 flex items-center gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors cursor-pointer"
                                        >
                                            <FileText className="w-2.5 h-2.5 text-primary"/>
                                            <span className="text-foreground/80">{file.name}</span>
                                            <Download className="w-2.5 h-2.5 text-muted-foreground"/>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {event.analysisResult && (
                            <div>
                                <span className="text-[10px] text-muted-foreground font-medium">AI Analysis</span>
                                <p className="text-[11px] text-foreground/80">{event.analysisResult}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="w-2.5 h-2.5"/>
                    {event.date}
                    <Clock className="w-2.5 h-2.5 ml-1"/>
                    {event.time}
                </div>
            </div>
        </div>
    );
}
