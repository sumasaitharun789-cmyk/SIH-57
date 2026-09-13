'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'red';
  subLabel?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  trend,
  accentColor = 'cyan',
  subLabel,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated number counter
  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/25 group-hover:border-cyan-400/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]',
      iconBg: 'bg-cyan-950/60 border-cyan-700/40 text-cyan-400',
      valueColor: 'text-cyan-300',
      dot: 'bg-cyan-400',
    },
    emerald: {
      border: 'border-emerald-500/25 group-hover:border-emerald-400/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      iconBg: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-400',
      valueColor: 'text-emerald-300',
      dot: 'bg-emerald-400',
    },
    amber: {
      border: 'border-amber-500/25 group-hover:border-amber-400/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      iconBg: 'bg-amber-950/60 border-amber-700/40 text-amber-400',
      valueColor: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    red: {
      border: 'border-red-500/30 group-hover:border-red-400/60',
      glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      iconBg: 'bg-red-950/60 border-red-700/50 text-red-400',
      valueColor: 'text-red-300',
      dot: 'bg-red-400',
    },
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`group relative overflow-hidden rounded-xl border bg-[#0a1628]/80 p-5 backdrop-blur-md transition-all duration-300 ${colorStyles.border} ${colorStyles.glow}`}
    >
      {/* Corner technical crosshairs */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className={`h-1.5 w-1.5 rounded-full ${colorStyles.dot} opacity-60`} />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            {label}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-3xl lg:text-4xl font-black font-mono-code tracking-tight ${colorStyles.valueColor}`}>
              {prefix}
              {displayValue.toLocaleString()}
              {suffix}
            </span>
          </div>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${colorStyles.iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Sublabel & Trend indicator */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        {trend && (
          <div className="flex items-center gap-1">
            {trend.isNeutral ? (
              <Minus className="h-3 w-3 text-slate-400" />
            ) : trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span
              className={`font-mono-code text-[11px] font-medium ${
                trend.isNeutral
                  ? 'text-slate-400'
                  : trend.isPositive
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {trend.value}
            </span>
          </div>
        )}

        {subLabel && (
          <span className="text-[10px] font-mono-code text-slate-400 ml-auto truncate">
            {subLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
