'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Bell,
  Download,
  FileText,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/lib/dashboard-context';

interface AlertsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertsSidebar({ isOpen, onClose }: AlertsSidebarProps) {
  const { alerts, markAlertAsRead } = useDashboard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportTimestamp, setReportTimestamp] = useState<string | null>(null);

  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const hasCriticalAlert = criticalAlerts.length > 0;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setReportGenerated(true);
    setReportTimestamp(new Date().toLocaleString());
  };

  const handleDownloadReport = () => {
    // Mock download - would generate PDF in production
    const blob = new Blob(['Clinical Report PDF Content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardian-clinical-report-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="p-2.5 space-y-1.5">
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
              <div className="px-2.5 py-1.5 flex items-center gap-2">
                <AlertTriangle
                  className={cn('w-3.5 h-3.5 shrink-0', {
                    'text-critical': alert.type === 'critical',
                    'text-warning': alert.type === 'warning',
                    'text-primary': alert.type === 'info',
                  })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-foreground truncate">
                      {alert.patientName}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 leading-tight">
                      Bed {alert.bedNumber}
                    </Badge>
                    {alert.isRead && (
                      <CheckCircle className="w-3 h-3 text-success shrink-0 ml-auto" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {alert.message}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 self-start mt-0.5">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="p-4 border-t border-border bg-muted/30">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Clinical Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
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
                'Generate Clinical Report'
              )}
            </Button>

            {/* Sepsis Alert Download */}
            {hasCriticalAlert && reportGenerated && (
              <div className="p-3 bg-critical/5 border border-critical/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-critical" />
                  <span className="text-sm font-medium text-critical">
                    Sepsis Alert Active
                  </span>
                </div>
                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  size="sm"
                  className="w-full border-critical/30 text-critical hover:bg-critical/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Summary
                </Button>
                {reportTimestamp && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Generated: {reportTimestamp}
                  </p>
                )}
              </div>
            )}

            {reportGenerated && !hasCriticalAlert && (
              <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    Report Ready
                  </span>
                </div>
                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  size="sm"
                  className="w-full border-success/30 text-success hover:bg-success/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                {reportTimestamp && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Generated: {reportTimestamp}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
