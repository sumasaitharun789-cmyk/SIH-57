'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  AlertTriangle,
  Flame,
  ArrowRight,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { AlertItem } from '../lib/types';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onSelectAlert: (detectionId: string) => void;
  onMarkAllRead: () => void;
}

export default function AlertPanel({
  isOpen,
  onClose,
  alerts,
  onSelectAlert,
  onMarkAllRead,
}: AlertPanelProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex h-full w-full max-w-md flex-col border-l border-cyan-950/80 bg-[#0a1628] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-950/80 px-6 py-4 bg-[#060e1e]">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="h-5 w-5 text-cyan-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                MISSION ALERTS & CONTACT NOTIFICATIONS
              </h3>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close alerts panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader action */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs font-mono-code">
            <span className="text-slate-400">
              {alerts.filter((a) => !a.read).length} UNACKNOWLEDGED
            </span>
            <button
              onClick={onMarkAllRead}
              className="text-cyan-400 hover:underline"
            >
              Acknowledge All
            </button>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-slate-500 text-xs font-mono-code">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <span>NO ACTIVE TACTICAL ALERTS</span>
              </div>
            ) : (
              alerts.map((alert) => {
                const isHigh = alert.priority === 'HIGH';

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      onSelectAlert(alert.detectionId);
                      onClose();
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                      isHigh
                        ? 'border-red-500/50 bg-red-950/20 hover:bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/30'
                    } ${!alert.read ? 'ring-1 ring-cyan-500/40' : 'opacity-80'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isHigh ? (
                          <Flame className="h-4 w-4 text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-[10px] font-mono-code font-bold px-2 py-0.2 rounded border ${
                            isHigh
                              ? 'bg-red-950 border-red-700 text-red-300'
                              : 'bg-amber-950 border-amber-700 text-amber-300'
                          }`}
                        >
                          {alert.priority} PRIORITY
                        </span>
                      </div>

                      <span className="text-[10px] font-mono-code text-slate-400">
                        {alert.timestamp}
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-bold text-white font-mono-code">
                      {alert.title} ({alert.detectionId})
                    </h4>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono-code pt-2 border-t border-slate-800/80">
                      <span className="text-cyan-400">Target Contact: {alert.detectionId}</span>
                      <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                        <span>Inspect in Sonar</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-cyan-950/80 bg-[#060e1e] text-[11px] font-mono-code text-slate-500 text-center">
            PULSEDEPTH TACTICAL EARLY WARNING SYSTEM • SECTOR 07
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
