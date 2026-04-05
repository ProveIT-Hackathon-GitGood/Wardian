'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Thermometer, Activity, Bed, User } from 'lucide-react';
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
      borderClass: 'border-success/20',
      bgClass: 'bg-success/5',
      iconClass: 'text-success',
    },
    warning: {
      badge: 'Warning',
      badgeClass: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
      borderClass: 'border-warning/20',
      bgClass: 'bg-warning/5',
      iconClass: 'text-warning',
    },
    critical: {
      badge: 'Critical Sepsis Risk',
      badgeClass: 'bg-critical/10 text-critical border-critical/30 hover:bg-critical/20',
      borderClass: 'border-critical/20',
      bgClass: 'bg-critical/5',
      iconClass: 'text-critical',
    },
  };

  const config = statusConfig[patient.status];

  return (
    <Card
      id={`bed-${patient.bedNumber}`}
      onClick={onClick}
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:-translate-y-1',
        config.borderClass,
        isHighlighted && 'animate-highlight-bed ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardContent className="p-4">
        {/* Header - Bed and Patient identification */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Patient Avatar (Icon + Initials) */}
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105",
              config.bgClass
            )}>
              <User className={cn("w-7 h-7 opacity-80", config.iconClass)} />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-7 h-7 rounded-lg border-2 border-card flex items-center justify-center text-[10px] font-bold shadow-sm",
                config.iconClass,
                "bg-card"
              )}>
                {patient.initials}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Bed className={cn("w-3.5 h-3.5", config.iconClass)} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Bed {patient.bedNumber}</span>
              </div>
              <h3 className="font-bold text-foreground text-base truncate leading-tight">
                {patient.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant="outline" className={cn('mb-3', config.badgeClass)}>
          {config.badge}
        </Badge>

        {/* Quick Vitals */}
        <div className="grid grid-cols-3 gap-2">
          <VitalItem
            icon={<Heart className="w-3.5 h-3.5" />}
            label="HR"
            value={`${patient.vitals.heartRate}`}
            unit="bpm"
            isAbnormal={patient.vitals.heartRate > 100 || patient.vitals.heartRate < 60}
          />
          <VitalItem
            icon={<Thermometer className="w-3.5 h-3.5" />}
            label="Temp"
            value={`${patient.vitals.temperature}`}
            unit="°C"
            isAbnormal={patient.vitals.temperature > 38}
          />
          <VitalItem
            icon={<Activity className="w-3.5 h-3.5" />}
            label="SpO2"
            value={`${patient.vitals.oxygenSaturation}`}
            unit="%"
            isAbnormal={patient.vitals.oxygenSaturation < 95}
          />
        </div>

        {/* Sepsis Risk Score (for critical/warning) */}
        {patient.status !== 'stable' && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sepsis Risk</span>
              <span className={cn('text-sm font-black italic', config.iconClass)}>
                {patient.sepsisRiskScore}%
              </span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden p-0.5 border border-border/20">
              <div
                className={cn('h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)]', {
                  'bg-gradient-to-r from-warning/60 to-warning': patient.status === 'warning',
                  'bg-gradient-to-r from-critical/60 to-critical': patient.status === 'critical',
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
  label,
  value,
  unit,
  isAbnormal,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-colors',
        isAbnormal 
          ? 'bg-critical/5 border-critical/20 text-critical shadow-[inset_0_0_12px_rgba(239,68,68,0.05)]' 
          : 'bg-muted/30 border-border/10 text-muted-foreground'
      )}
    >
      <div className="flex items-center gap-1 opacity-70">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={cn('text-sm font-bold tracking-tight', isAbnormal ? 'text-critical' : 'text-foreground')}>
          {value}
        </span>
        <span className="text-[9px] font-medium opacity-60">{unit}</span>
      </div>
    </div>
  );
}
