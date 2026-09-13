'use client';

import React from 'react';
import { Clock, ShieldAlert, CheckCircle, Radio, Sparkles, Navigation } from 'lucide-react';
import { TimelineEvent } from '../lib/types';

interface MissionTimelineProps {
  timelineEvents: TimelineEvent[];
  onSelectEventDetection?: (detectionId: string) => void;
}

export default function MissionTimeline({
  timelineEvents,
  onSelectEventDetection,
}: MissionTimelineProps) {
  return (
    <div className="flex flex-col space-y-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">
            MISSION EVENT LOG & AUDIT TRAIL
          </h3>
        </div>
        <span className="text-[10px] font-mono-code text-slate-400">
          LOGGED IN REAL-TIME (UTC)
        </span>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-cyan-800 before:to-transparent">
        {timelineEvents.map((evt) => {
          const isHigh = evt.priority === 'HIGH';

          return (
            <div key={evt.id} className="relative group">
              {/* Bullet node on vertical line */}
              <div
                className={`absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-[#060e1e] transition-transform group-hover:scale-125 ${
                  isHigh
                    ? 'border-red-500 shadow-[0_0_8px_#ef4444]'
                    : evt.type === 'fusion'
                    ? 'border-emerald-400 shadow-[0_0_8px_#10b981]'
                    : 'border-cyan-400'
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    isHigh
                      ? 'bg-red-400 animate-ping'
                      : evt.type === 'fusion'
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                />
              </div>

              {/* Event Content Box */}
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 hover:border-cyan-700/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-code font-bold text-cyan-300">
                    {evt.time}
                  </span>

                  {evt.priority && (
                    <span
                      className={`text-[9px] font-mono-code font-bold px-2 py-0.2 rounded border ${
                        isHigh
                          ? 'bg-red-950/80 border-red-700 text-red-300'
                          : 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                      }`}
                    >
                      {evt.priority} PRIORITY
                    </span>
                  )}
                </div>

                <h4 className="mt-1 text-sm font-semibold text-slate-100">{evt.title}</h4>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                  {evt.description}
                </p>

                {evt.detectionId && onSelectEventDetection && (
                  <button
                    onClick={() => onSelectEventDetection(evt.detectionId!)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono-code text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    <span>Inspect Target Contact ({evt.detectionId}) &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
