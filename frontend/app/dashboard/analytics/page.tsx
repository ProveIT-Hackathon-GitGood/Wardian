'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Heart,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { VITALS_HISTORY, WARD_RISK_DISTRIBUTION, MOCK_PATIENTS } from '@/lib/mock-data';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [selectedPatient, setSelectedPatient] = useState('p4');
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient);

  // Calculate stats
  const totalPatients = MOCK_PATIENTS.length;
  const criticalCount = MOCK_PATIENTS.filter((p) => p.status === 'critical').length;
  const warningCount = MOCK_PATIENTS.filter((p) => p.status === 'warning').length;
  const avgRiskScore = Math.round(
    MOCK_PATIENTS.reduce((acc, p) => acc + p.sepsisRiskScore, 0) / totalPatients
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

        {/* Vitals Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selector */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-critical" />
                Patient Vitals Trend
              </CardTitle>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PATIENTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Bed {p.bedNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {patient && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Viewing vitals for <span className="font-medium text-foreground">{patient.name}</span>
                    {' '}- {patient.diagnosis}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Heart Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="w-4 h-4 text-critical" />
                Heart Rate (bpm)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={VITALS_HISTORY.heartRate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[60, 120]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--critical))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--critical))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="w-4 h-4 text-warning" />
                Temperature (°C)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={VITALS_HISTORY.temperature}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[36, 40]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--warning))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" />
                Blood Pressure (mmHg)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={VITALS_HISTORY.bloodPressure}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[50, 130]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      name="Diastolic"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Risk Distribution by Ward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WARD_RISK_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="ward"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="low"
                      name="Low Risk"
                      stackId="a"
                      fill="hsl(var(--success))"
                    />
                    <Bar
                      dataKey="moderate"
                      name="Moderate"
                      stackId="a"
                      fill="hsl(var(--chart-3))"
                    />
                    <Bar
                      dataKey="high"
                      name="High Risk"
                      stackId="a"
                      fill="hsl(var(--warning))"
                    />
                    <Bar
                      dataKey="critical"
                      name="Critical"
                      stackId="a"
                      fill="hsl(var(--critical))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

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
