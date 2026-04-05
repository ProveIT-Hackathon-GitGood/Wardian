'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, Thermometer, Droplets, Zap } from 'lucide-react';

interface AnatomyViewProps {
  riskScore: number;
  className?: string;
}

export const AnatomyView: React.FC<AnatomyViewProps> = ({ riskScore, className }) => {
  // Determine color and speed based on risk score
  const getStatus = (score: number) => {
    if (score < 30) return { 
      color: '#22c55e', // Success Green
      glow: '0 0 10px rgba(34, 197, 94, 0.4)',
      speed: 2.5,
      label: 'Stable',
      bgGlow: 'radial-gradient(circle, rgba(34, 197, 94, 0.05) 0%, transparent 70%)'
    };
    if (score < 70) return { 
      color: '#f59e0b', // Warning Amber
      glow: '0 0 15px rgba(245, 158, 11, 0.5)',
      speed: 1.2,
      label: 'Warning',
      bgGlow: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)'
    };
    return { 
      color: '#ef4444', // Critical Red
      glow: '0 0 25px rgba(239, 68, 68, 0.8)',
      speed: 0.6,
      label: 'Critical',
      bgGlow: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)'
    };
  };

  const status = getStatus(riskScore);

  return (
    <div className={cn("relative flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden min-h-[225px]", className)}>
      {/* Background Ambience */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ 
          background: status.bgGlow,
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: status.speed * 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header Info */}
      <div className="absolute top-3 left-4 z-10 space-y-0.5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Vascular Analysis</h3>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", {
            'bg-green-500': riskScore < 30,
            'bg-amber-500': riskScore >= 30 && riskScore < 70,
            'bg-red-500': riskScore >= 70,
          })} />
          <span className="text-[9px] font-semibold text-slate-200 uppercase tracking-tight">{status.label} Flow</span>
        </div>
      </div>

      {/* The Anatomy SVG - Adjusted for wider panel */}
      <div className="relative w-full max-w-[220px] aspect-[4/3] z-10 flex items-center justify-center translate-y-1">
        <svg viewBox="0 20 100 160" className="h-full w-auto filter drop-shadow-xl scale-[1.3] translate-y-2">
          {/* Subtle Silhouette Outline */}
          <path
            d="M50 5 C55 5, 60 10, 60 18 C60 25, 55 30, 50 30 C45 30, 40 25, 40 18 C40 10, 45 5, 50 5 
               M40 32 L60 32 L65 45 L85 85 C87 90, 85 95, 80 95 C75 95, 74 90, 72 85 L65 65 L65 140 L75 190 C76 195, 72 198, 68 198 C64 198, 61 195, 60 190 L55 145 L50 145 L45 145 L40 190 C39 195, 36 198, 32 198 C28 198, 24 195, 25 190 L35 140 L35 65 L28 85 C26 90, 25 95, 20 95 C15 95, 13 90, 15 85 L35 45 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />

          {/* SKELETON (Simplified) */}
          <g stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeLinecap="round">
            {/* Spine */}
            <line x1="50" y1="30" x2="50" y2="135" strokeDasharray="1 3" />
            {/* Ribcage */}
            <path d="M42 45 Q50 40 58 45 M40 55 Q50 50 60 55 M38 65 Q50 60 62 65 M40 75 Q50 70 60 75" opacity="0.6" />
            {/* Pelvis */}
            <path d="M38 135 Q50 125 62 135" />
            {/* Skull */}
            <circle cx="50" cy="18" r="8" strokeWidth="0.5" opacity="0.3" />
          </g>

          {/* VEINS - PRIMARY SYSTEM */}
          <g fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Main Central Vein */}
            <motion.path
              d="M50 30 L50 135"
              stroke={status.color}
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: 1,
                strokeOpacity: [0.4, 1, 0.4],
                strokeWidth: [1, 1.8, 1]
              }}
              transition={{ 
                pathLength: { duration: 2, ease: "easeOut" },
                strokeOpacity: { duration: status.speed, repeat: Infinity, ease: "easeInOut" },
                strokeWidth: { duration: status.speed, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />

            {/* Left Arm Branch */}
            <motion.path
              d="M50 45 L35 60 L18 85"
              stroke={status.color}
              animate={{ 
                strokeOpacity: [0.3, 0.8, 0.3],
                strokeWidth: [0.8, 1.4, 0.8]
              }}
              transition={{ 
                duration: status.speed,
                repeat: Infinity,
                delay: 0.2,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />

            {/* Right Arm Branch */}
            <motion.path
              d="M50 45 L65 60 L82 85"
              stroke={status.color}
              animate={{ 
                strokeOpacity: [0.3, 0.8, 0.3],
                strokeWidth: [0.8, 1.4, 0.8]
              }}
              transition={{ 
                duration: status.speed,
                repeat: Infinity,
                delay: 0.2,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />

            {/* Left Leg Branch */}
            <motion.path
              d="M50 135 L40 160 L32 195"
              stroke={status.color}
              animate={{ 
                strokeOpacity: [0.2, 0.7, 0.2],
                strokeWidth: [0.8, 1.4, 0.8]
              }}
              transition={{ 
                duration: status.speed,
                repeat: Infinity,
                delay: 0.4,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />

            {/* Right Leg Branch */}
            <motion.path
              d="M50 135 L60 160 L68 195"
              stroke={status.color}
              animate={{ 
                strokeOpacity: [0.2, 0.7, 0.2],
                strokeWidth: [0.8, 1.4, 0.8]
              }}
              transition={{ 
                duration: status.speed,
                repeat: Infinity,
                delay: 0.4,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />

            {/* Organ Plexus (Heart Area) */}
            <motion.circle
              cx="45"
              cy="55"
              r="4"
              fill={status.color}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: status.speed,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(${status.glow})` }}
            />
          </g>
        </svg>
      </div>

      {/* Real-time Telemetry Overlay */}
      <div className="absolute bottom-3 right-4 z-10 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-2xl">
           <Zap className={cn("w-3 h-3", riskScore >= 70 ? "text-red-500" : "text-amber-500")} />
           <span className="text-[12px] font-black italic text-white tracking-widest">{riskScore}%</span>
        </div>
      </div>

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-[1]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
    </div>
  );
};
