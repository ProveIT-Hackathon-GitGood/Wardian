'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {Activity, AlertTriangle, ArrowLeft, Loader2, Plus, TrendingDown, TrendingUp, Users, X,} from 'lucide-react';
import Link from 'next/link';
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts';
import {MOCK_PATIENTS} from '@/lib/mock-data';
import {useDashboard} from '@/lib/dashboard-context';
import {apiGet} from '@/lib/api/client';
import {useCallback, useEffect, useMemo, useState} from 'react';

const VITAL_SIGNS_OPTIONS = [
  { key: 'HR', label: 'Heart Rate', unit: 'bpm', color: 'hsl(var(--critical))' },
  { key: 'O2Sat', label: 'O₂ Saturation', unit: '%', color: 'hsl(var(--chart-1))' },
  { key: 'Temp', label: 'Temperature', unit: '°C', color: 'hsl(var(--warning))' },
  { key: 'SBP', label: 'Systolic BP', unit: 'mmHg', color: 'hsl(var(--chart-2))' },
  { key: 'MAP', label: 'Mean Arterial P.', unit: 'mmHg', color: '#7C3AED' },
  { key: 'DBP', label: 'Diastolic BP', unit: 'mmHg', color: 'hsl(var(--chart-5))' },
  { key: 'Resp', label: 'Respiratory Rate', unit: '/min', color: '#0EA5E9' },
  { key: 'EtCO2', label: 'EtCO₂', unit: 'mmHg', color: '#F97316' },
  { key: 'BaseExcess', label: 'Base Excess', unit: 'mEq/L', color: '#14B8A6' },
  { key: 'HCO3', label: 'HCO₃', unit: 'mEq/L', color: '#8B5CF6' },
  { key: 'FiO2', label: 'FiO₂', unit: '%', color: '#EC4899' },
  { key: 'pH', label: 'pH', unit: '', color: '#06B6D4' },
  { key: 'PaCO2', label: 'PaCO₂', unit: 'mmHg', color: '#D946EF' },
  { key: 'SaO2', label: 'SaO₂', unit: '%', color: '#10B981' },
  { key: 'AST', label: 'AST', unit: 'U/L', color: '#F59E0B' },
  { key: 'BUN', label: 'BUN', unit: 'mg/dL', color: '#EF4444' },
  { key: 'Alkalinephos', label: 'Alk. Phos.', unit: 'U/L', color: '#84CC16' },
  { key: 'Calcium', label: 'Calcium', unit: 'mg/dL', color: '#22D3EE' },
  { key: 'Chloride', label: 'Chloride', unit: 'mEq/L', color: '#A78BFA' },
  { key: 'Creatinine', label: 'Creatinine', unit: 'mg/dL', color: '#FB923C' },
  { key: 'Bilirubin_direct', label: 'Direct Bilirubin', unit: 'mg/dL', color: '#FBBF24' },
  { key: 'Glucose', label: 'Glucose', unit: 'mg/dL', color: '#34D399' },
  { key: 'Lactate', label: 'Lactate', unit: 'mmol/L', color: '#F87171' },
  { key: 'Magnesium', label: 'Magnesium', unit: 'mg/dL', color: '#818CF8' },
  { key: 'Phosphate', label: 'Phosphate', unit: 'mg/dL', color: '#2DD4BF' },
  { key: 'Potassium', label: 'Potassium', unit: 'mEq/L', color: '#FB7185' },
  { key: 'Bilirubin_total', label: 'Total Bilirubin', unit: 'mg/dL', color: '#FCD34D' },
  { key: 'TroponinI', label: 'Troponin I', unit: 'ng/mL', color: '#E11D48' },
  { key: 'Hct', label: 'Hematocrit', unit: '%', color: '#059669' },
  { key: 'Hgb', label: 'Hemoglobin', unit: 'g/dL', color: '#DC2626' },
  { key: 'PTT', label: 'PTT', unit: 's', color: '#7C3AED' },
  { key: 'WBC', label: 'WBC', unit: '×10³/µL', color: '#0891B2' },
  { key: 'Fibrinogen', label: 'Fibrinogen', unit: 'mg/dL', color: '#C026D3' },
  { key: 'Platelets', label: 'Platelets', unit: '×10³/µL', color: '#EA580C' },
];

interface BackendVitalRecord {
  id: number;
  patient_id: number;
  timestamp: string | null;
  hour: number | null;
  [key: string]: number | string | null | undefined;
}

interface ChartDataPoint {
  time: string;
  value: number;
  rawTimestamp: string;
}

export default function AnalyticsPage() {
  const [selectedPatient, setSelectedPatient] = useState('p4');
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient);

  const totalPatients = MOCK_PATIENTS.length;
  const criticalCount = MOCK_PATIENTS.filter((p) => p.status === 'critical').length;
  const warningCount = MOCK_PATIENTS.filter((p) => p.status === 'warning').length;
  const avgRiskScore = Math.round(
    MOCK_PATIENTS.reduce((acc, p) => acc + p.sepsisRiskScore, 0) / totalPatients
  );

  const { patients: realPatients } = useDashboard();

  const [selectedRealPatientId, setSelectedRealPatientId] = useState<string>('');
  const [selectedVitals, setSelectedVitals] = useState<string[]>(['HR', 'Temp']);
  const [vitalToAdd, setVitalToAdd] = useState<string>('');
  const [vitalsData, setVitalsData] = useState<BackendVitalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRealPatientId && realPatients.length > 0) {
      setSelectedRealPatientId(realPatients[0].id);
    }
  }, [realPatients, selectedRealPatientId]);

  const currentRealPatient = useMemo(
    () => realPatients.find((p) => p.id === selectedRealPatientId),
    [realPatients, selectedRealPatientId]
  );

  // Fetch vitals from backend
  const fetchVitals = useCallback(async () => {
    if (!currentRealPatient?.backendId) {
      setVitalsData([]);
      return;
    }
    setIsLoading(true);
    setVitalsError(null);
    try {
      const data = await apiGet<BackendVitalRecord[]>(
        `/api/v1/patient-vital/patient/${currentRealPatient.backendId}`,
        true
      );
      setVitalsData(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Failed to fetch vitals:', e);
      setVitalsError(e?.message || 'Failed to load vitals data');
      setVitalsData([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentRealPatient?.backendId]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  const buildChartData = useCallback(
    (vitalKey: string): ChartDataPoint[] => {
      return vitalsData
        .filter((record) => record[vitalKey] != null)
        .sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : (a.hour ?? 0);
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : (b.hour ?? 0);
          return ta - tb;
        })
        .map((record) => {
          const ts = record.timestamp ? new Date(record.timestamp) : null;
          return {
            time: ts
              ? ts.toLocaleString('en-GB', {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : `H${record.hour}`,
            value: Number(record[vitalKey]),
            rawTimestamp: record.timestamp || `Hour ${record.hour}`,
          };
        });
    },
    [vitalsData]
  );

  const addVital = useCallback(
    (key: string) => {
      if (key && !selectedVitals.includes(key)) {
        setSelectedVitals((prev) => [...prev, key]);
      }
      setVitalToAdd('');
    },
    [selectedVitals]
  );

  const removeVital = useCallback((key: string) => {
    setSelectedVitals((prev) => prev.filter((v) => v !== key));
  }, []);

  const availableVitals = useMemo(
    () => VITAL_SIGNS_OPTIONS.filter((opt) => !selectedVitals.includes(opt.key)),
    [selectedVitals]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/wardian-logo.png" alt="Wardian" className="h-[1.7rem] w-auto" />
            <span className="text-lg font-bold text-foreground">Analytics</span>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Patients"
            value={totalPatients.toString()}
            icon={<Users className="w-5 h-5" />}
            trend={null}
          />
          <StatCard
            title="Critical Alerts"
            value={criticalCount.toString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: '+1', isUp: true, label: 'from yesterday' }}
            variant="critical"
          />
          <StatCard
            title="Warning Status"
            value={warningCount.toString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: '-2', isUp: false, label: 'from yesterday' }}
            variant="warning"
          />
          <StatCard
            title="Avg Risk Score"
            value={`${avgRiskScore}%`}
            icon={<Activity className="w-5 h-5" />}
            trend={{ value: '+5%', isUp: true, label: 'this week' }}
          />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Patient Vitals Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Patient
                </label>
                <Select
                  value={selectedRealPatientId}
                  onValueChange={(val) => setSelectedRealPatientId(val)}
                >
                  <SelectTrigger id="real-patient-selector" className="w-full sm:w-[320px]">
                    <SelectValue placeholder="Select a patient…" />
                  </SelectTrigger>
                  <SelectContent>
                    {realPatients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.bedNumber ? ` — Bed ${p.bedNumber}` : ' — Unassigned'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentRealPatient && (
                <div className="p-3 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {currentRealPatient.initials}
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{currentRealPatient.name}</span>
                    <span className="text-muted-foreground">
                      {' '}— {currentRealPatient.age}{currentRealPatient.gender === 'M' ? 'M' : 'F'},{' '}
                      {currentRealPatient.diagnosis || 'No diagnosis'}
                    </span>
                    <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Risk: {currentRealPatient.sepsisRiskScore ?? 0}%
                    </span>
                  </div>
                </div>
              )}

              {/* Selected vitals chips + add selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Selected Vitals
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedVitals.map((key) => {
                    const opt = VITAL_SIGNS_OPTIONS.find((o) => o.key === key);
                    return (
                      <button
                        key={key}
                        onClick={() => removeVital(key)}
                        className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                        style={{
                          backgroundColor: `${opt?.color ?? 'hsl(var(--primary))'}18`,
                          color: opt?.color ?? 'hsl(var(--primary))',
                          border: `1px solid ${opt?.color ?? 'hsl(var(--primary))'}30`,
                        }}
                      >
                        {opt?.label ?? key}
                        {opt?.unit && (
                          <span className="opacity-60">({opt.unit})</span>
                        )}
                        <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                      </button>
                    );
                  })}

                  {/* Add vital button */}
                  {availableVitals.length > 0 && (
                    <div className="inline-flex items-center gap-1">
                      <Select value={vitalToAdd} onValueChange={addVital}>
                        <SelectTrigger
                          id="add-vital-selector"
                          className="h-8 w-[180px] text-xs border-dashed"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 opacity-50" />
                          <SelectValue placeholder="Add vital sign…" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVitals.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key} className="text-xs">
                              {opt.label}
                              {opt.unit && (
                                <span className="text-muted-foreground ml-1">({opt.unit})</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Loading vitals data…</span>
            </div>
          )}

          {/* Error state */}
          {vitalsError && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">{vitalsError}</CardContent>
            </Card>
          )}

          {/* No patient selected */}
          {!currentRealPatient && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Select a patient to view vitals charts</p>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Vitals Charts Grid */}
          {!isLoading && currentRealPatient && selectedVitals.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedVitals.map((vitalKey) => {
                const opt = VITAL_SIGNS_OPTIONS.find((o) => o.key === vitalKey);
                const chartData = buildChartData(vitalKey);
                const color = opt?.color ?? 'hsl(var(--primary))';

                return (
                  <VitalChart
                    key={vitalKey}
                    vitalKey={vitalKey}
                    label={opt?.label ?? vitalKey}
                    unit={opt?.unit ?? ''}
                    color={color}
                    data={chartData}
                    onRemove={() => removeVital(vitalKey)}
                  />
                );
              })}
            </div>
          )}

          {/* No vitals selected */}
          {!isLoading && currentRealPatient && selectedVitals.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Add vital signs above to generate charts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Individual Vital Chart (dynamic, from backend) ───
function VitalChart({
  vitalKey,
  label,
  unit,
  color,
  data,
  onRemove,
}: {
  vitalKey: string;
  label: string;
  unit: string;
  color: string;
  data: ChartDataPoint[];
  onRemove: () => void;
}) {
  const hasData = data.length > 0;

  const [yMin, yMax] = useMemo(() => {
    if (!hasData) return [0, 100];
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || 1;
    return [
      Math.floor((min - padding) * 100) / 100,
      Math.ceil((max + padding) * 100) / 100,
    ];
  }, [data, hasData]);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="h-1 w-full" style={{ background: color }} />

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: color }}
          />
          {label}
          {unit && <span className="text-xs text-muted-foreground font-normal">({unit})</span>}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data available for {label}
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                  angle={-20}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
                        <p className="font-medium text-foreground">
                          {label}: {point.value} {unit}
                        </p>
                        <p className="text-muted-foreground mt-0.5">{point.rawTimestamp}</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ fill: color, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  name={label}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasData && (
          <p className="text-xs text-muted-foreground mt-2 text-right tabular-nums">
            {data.length} data point{data.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Stat Card Component ───
function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: { value: string; isUp: boolean; label: string } | null;
  variant?: 'default' | 'critical' | 'warning';
}) {
  const variantStyles = {
    default: 'bg-card',
    critical: 'bg-critical/5 border-critical/30',
    warning: 'bg-warning/5 border-warning/30',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    critical: 'bg-critical/10 text-critical',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {trend.isUp ? (
                  <TrendingUp className="w-3 h-3 text-critical" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-success" />
                )}
                <span
                  className={trend.isUp ? 'text-critical' : 'text-success'}
                >
                  {trend.value}
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
