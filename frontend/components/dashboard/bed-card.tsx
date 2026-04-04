'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Thermometer, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/mock-data';

interface BedCardProps {
  patient: Patient;
  isHighlighted: boolean;
  onClick: () => void;
}

export function BedCard({ patient, isHighlighted, onClick }: BedCardProps) {
  const statusConfig = {
    stable: {
      badge: 'Stable',
      badgeClass: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
      borderClass: 'border-success/30',
      bgClass: 'bg-success/5',
    },
    warning: {
      badge: 'Warning',
      badgeClass: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
      borderClass: 'border-warning/30',
      bgClass: 'bg-warning/5',
    },
    critical: {
      badge: 'Critical Sepsis Risk',
      badgeClass: 'bg-critical/10 text-critical border-critical/30 hover:bg-critical/20',
      borderClass: 'border-critical/30',
      bgClass: 'bg-critical/5',
    },
  };

  const config = statusConfig[patient.status];

  return (
    <Card
      id={`bed-${patient.bedNumber}`}
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-300 hover:shadow-lg border-2',
        config.borderClass,
        isHighlighted && 'animate-highlight-bed ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold',
                config.bgClass,
                {
                  'text-success': patient.status === 'stable',
                  'text-warning': patient.status === 'warning',
                  'text-critical': patient.status === 'critical',
                }
              )}
            >
              {patient.initials}
            </div>
            <div>
              <p className="font-semibold text-foreground">Bed {patient.bedNumber}</p>
              <p className="text-sm text-muted-foreground">{patient.name}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant="outline" className={cn('mb-3', config.badgeClass)}>
          {config.badge}
        </Badge>

        {/* Quick Vitals */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <VitalItem
            icon={<Heart className="w-3 h-3" />}
            value={`${patient.vitals.heartRate}`}
            unit="bpm"
            isAbnormal={patient.vitals.heartRate > 100 || patient.vitals.heartRate < 60}
          />
          <VitalItem
            icon={<Thermometer className="w-3 h-3" />}
            value={`${patient.vitals.temperature}`}
            unit="°C"
            isAbnormal={patient.vitals.temperature > 38}
          />
          <VitalItem
            icon={<Activity className="w-3 h-3" />}
            value={`${patient.vitals.oxygenSaturation}`}
            unit="%"
            isAbnormal={patient.vitals.oxygenSaturation < 95}
          />
        </div>

        {/* Sepsis Risk Score (for critical/warning) */}
        {patient.status !== 'stable' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sepsis Risk</span>
              <span
                className={cn('text-sm font-bold', {
                  'text-warning': patient.status === 'warning',
                  'text-critical': patient.status === 'critical',
                })}
              >
                {patient.sepsisRiskScore}%
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', {
                  'bg-warning': patient.status === 'warning',
                  'bg-critical': patient.status === 'critical',
                })}
                style={{ width: `${patient.sepsisRiskScore}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VitalItem({
  icon,
  value,
  unit,
  isAbnormal,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  isAbnormal: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg',
        isAbnormal ? 'bg-critical/10 text-critical' : 'bg-muted text-muted-foreground'
      )}
    >
      {icon}
      <span className={cn('font-semibold', isAbnormal ? 'text-critical' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-[10px]">{unit}</span>
    </div>
  );
}
