'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  X,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/lib/dashboard-context';
import type { Alert } from '@/lib/mock-data';

interface GeneratedReport {
  id: string;
  timestamp: string;
  label: string;
  hasCritical: boolean;
  blob: Blob;
  url: string;
}

interface AlertsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

async function buildReportPdf(alerts: Alert[], patients: { name: string; bedNumber: string; status: string; sepsisRiskScore: number; diagnosis: string }[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkPage = (needed: number) => { if (y + needed > 275) addPage(); };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Wardian Clinical Report', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  doc.text(`Total patients: ${patients.length}  |  Active alerts: ${alerts.filter(a => !a.isRead).length}`, pageW - margin, y, { align: 'right' });
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Critical alerts section
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  if (criticalAlerts.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y - 3, pageW - margin * 2, 8 + criticalAlerts.length * 7, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`⚠ Critical Alerts (${criticalAlerts.length})`, margin + 4, y + 2);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    for (const alert of criticalAlerts) {
      checkPage(8);
      doc.text(`• ${alert.patientName} (Bed ${alert.bedNumber}): ${alert.message}`, margin + 6, y);
      y += 7;
    }
    y += 6;
  }

  // Warning alerts
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  if (warningAlerts.length > 0) {
    checkPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`Warning Alerts (${warningAlerts.length})`, margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    for (const alert of warningAlerts) {
      checkPage(8);
      doc.text(`• ${alert.patientName} (Bed ${alert.bedNumber}): ${alert.message}`, margin + 4, y);
      y += 7;
    }
    y += 6;
  }

  // Info alerts
  const infoAlerts = alerts.filter(a => a.type === 'info');
  if (infoAlerts.length > 0) {
    checkPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(`Informational Alerts (${infoAlerts.length})`, margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    for (const alert of infoAlerts) {
      checkPage(8);
      doc.text(`• ${alert.patientName} (Bed ${alert.bedNumber}): ${alert.message}`, margin + 4, y);
      y += 7;
    }
    y += 6;
  }

  // Patient summary table
  checkPage(30);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Patient Summary', margin, y);
  y += 8;

  // Table header
  const cols = [margin, margin + 35, margin + 55, margin + 80, margin + 110];
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Patient', cols[0] + 2, y);
  doc.text('Bed', cols[1] + 2, y);
  doc.text('Status', cols[2] + 2, y);
  doc.text('Sepsis Risk', cols[3] + 2, y);
  doc.text('Diagnosis', cols[4] + 2, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  for (const p of patients) {
    checkPage(8);
    doc.text(p.name, cols[0] + 2, y, { maxWidth: 32 });
    doc.text(p.bedNumber, cols[1] + 2, y);

    const statusColor = p.status === 'critical' ? [220, 38, 38] : p.status === 'warning' ? [217, 119, 6] : [5, 150, 105];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(p.status.charAt(0).toUpperCase() + p.status.slice(1), cols[2] + 2, y);

    doc.setTextColor(30, 41, 59);
    doc.text(`${p.sepsisRiskScore}%`, cols[3] + 2, y);
    doc.text(p.diagnosis.substring(0, 30), cols[4] + 2, y, { maxWidth: pageW - cols[4] - margin - 2 });

    y += 6;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y - 2, pageW - margin, y - 2);
  }

  // Footer
  y = 285;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Wardian Clinical Report — Confidential', margin, y);
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, pageW - margin, y, { align: 'right' });

  return doc.output('blob');
}

export function AlertsSidebar({ isOpen, onClose }: AlertsSidebarProps) {
  const { alerts, markAlertAsRead, patients } = useDashboard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState<GeneratedReport[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const hasCriticalAlert = criticalAlerts.length > 0;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const blob = await buildReportPdf(alerts, patients);
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const report: GeneratedReport = {
      id: `report-${Date.now()}`,
      timestamp: now.toLocaleString(),
      label: hasCriticalAlert ? 'Sepsis Alert Report' : 'Clinical Report',
      hasCritical: hasCriticalAlert,
      blob,
      url,
    };

    setReportHistory((prev) => [report, ...prev]);
    setIsGenerating(false);
    setHistoryExpanded(true);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    const a = document.createElement('a');
    a.href = report.url;
    a.download = `wardian-clinical-report-${report.id}.pdf`;
    a.click();
  };

  const handleDeleteReport = (id: string) => {
    setReportHistory((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((r) => r.id !== id);
    });
  };

  return (
    <aside
      className={cn(
        'fixed right-0 top-12 bottom-0 w-80 bg-card border-l border-border flex flex-col transition-transform duration-300 z-30',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Live Alerts</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-md cursor-pointer transition-all hover:shadow-sm border',
                !alert.isRead && 'border-l-[3px]',
                alert.type === 'critical' && !alert.isRead && 'border-l-critical bg-critical/5',
                alert.type === 'warning' && !alert.isRead && 'border-l-warning bg-warning/5',
                alert.type === 'info' && !alert.isRead && 'border-l-primary bg-primary/5',
                alert.isRead && 'border-border bg-card'
              )}
              onClick={() => markAlertAsRead(alert.id)}
            >
              <div className="px-3 py-3 flex items-start gap-2.5">
                <AlertTriangle
                  className={cn('w-4 h-4 shrink-0 mt-0.5', {
                    'text-critical': alert.type === 'critical',
                    'text-warning': alert.type === 'warning',
                    'text-primary': alert.type === 'info',
                  })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {alert.patientName}
                    </span>
                    <Badge variant="outline" className="text-xs py-0 px-1.5">
                      Bed {alert.bedNumber}
                    </Badge>
                    {alert.isRead && (
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="border-t border-border bg-muted/30 overflow-y-auto max-h-[40%]">
        <div className="p-3 space-y-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full"
            size="sm"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate Clinical Report
              </span>
            )}
          </Button>

          {/* Report History */}
          {reportHistory.length > 0 && (
            <div>
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-1"
              >
                {historyExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Past Reports ({reportHistory.length})
              </button>

              {historyExpanded && (
                <div className="space-y-1.5 mt-1">
                  {reportHistory.map((report) => (
                    <div
                      key={report.id}
                      className={cn(
                        'rounded-md border p-2.5 flex items-center gap-2',
                        report.hasCritical ? 'bg-critical/5 border-critical/20' : 'bg-card border-border'
                      )}
                    >
                      <FileText className={cn('w-4 h-4 shrink-0', report.hasCritical ? 'text-critical' : 'text-primary')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{report.label}</p>
                        <p className="text-[11px] text-muted-foreground">{report.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
