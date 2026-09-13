'use client';

import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Server,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { mockSystemHealth } from '../lib/mockData';

export default function MissionHealth() {
  const hardwareGauges = [
    { label: 'GPU CUDA Compute', value: '42%', icon: Zap, sub: 'NVIDIA RTX A5000 (35 FPS)' },
    { label: 'System Memory', value: '3.8 / 16 GB', icon: HardDrive, sub: 'DDR5 Low Jitter' },
    { label: 'Inference Latency', value: '28 ms', icon: Cpu, sub: 'TensorRT FP16 Mode' },
    { label: 'Towfish Telemetry', value: '14.2 MB/s', icon: Wifi, sub: 'Gigabit Ethernet Line' },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              MISSION HEALTH & SYSTEM DIAGNOSTICS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of acoustic sensors, GPU inference pipelines, and geospatial sync nodes.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs font-mono-code">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>ALL HARDWARE ONLINE (0 FAULTS)</span>
        </div>
      </div>

      {/* Hardware Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hardwareGauges.map((gauge) => {
          const Icon = gauge.icon;
          return (
            <div
              key={gauge.label}
              className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-4 backdrop-blur-md space-y-2"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono-code uppercase font-semibold">
                  {gauge.label}
                </span>
                <Icon className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black font-mono-code text-cyan-300">
                {gauge.value}
              </div>
              <div className="text-[10px] font-mono-code text-slate-500">{gauge.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Subsystem Nodes Grid */}
      <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md space-y-4">
        <h3 className="text-xs font-mono-code font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-950/80 pb-3">
          ACTIVE SERVICE MICROSERVICES & TELEMETRY STREAMS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockSystemHealth.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">{svc.name}</div>
                  <div className="text-[11px] font-mono-code text-slate-400">{svc.metrics}</div>
                </div>
              </div>

              <div className="flex flex-col items-end text-xs font-mono-code">
                <span className="text-emerald-400 font-bold">{svc.status}</span>
                <span className="text-[10px] text-slate-500">{svc.latencyMs}ms latency</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
