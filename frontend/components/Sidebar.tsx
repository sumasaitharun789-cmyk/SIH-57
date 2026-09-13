'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Radar,
  ScanEye,
  Layers,
  Database,
  MapPin,
  BarChart3,
  Ship,
  UploadCloud,
  Bell,
  FileText,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Waves,
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'sonar'
  | 'detection'
  | 'fusion'
  | 'database'
  | 'geo'
  | 'analytics'
  | 'missions'
  | 'upload'
  | 'alerts'
  | 'reports'
  | 'health'
  | 'settings';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadAlertCount: number;
}

export default function Sidebar({
  currentSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  unreadAlertCount,
}: SidebarProps) {
  const navGroups: NavGroup[] = [
    {
      label: 'COMMAND CENTER',
      items: [
        { id: 'overview', label: 'Mission Overview', icon: Compass },
        { id: 'sonar', label: 'Live Sonar', icon: Radar },
        { id: 'detection', label: 'Detection Analysis', icon: ScanEye },
        { id: 'fusion', label: 'Evidence Fusion', icon: Layers, highlight: true },
        { id: 'database', label: 'Anomaly Database', icon: Database },
        { id: 'geo', label: 'Geo Intelligence', icon: MapPin },
        { id: 'analytics', label: 'Mission Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'missions', label: 'Survey Missions', icon: Ship },
        { id: 'upload', label: 'Upload Sonar', icon: UploadCloud },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertCount },
        { id: 'reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'health', label: 'System Health', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-cyan-950/60 bg-[#060e1e]/95 backdrop-blur-xl transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64 lg:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-cyan-950/70">
        <div
          onClick={() => onSelectSection('overview')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:border-cyan-400 transition-colors">
            <Waves className="h-5 w-5 animate-pulse text-cyan-300" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#060e1e]" />
          </div>

          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                  PULSE<span className="text-cyan-400">DEPTH</span>
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  PRO-v2.4
                </span>
              </div>
              <span className="text-[9px] font-mono-code tracking-widest text-slate-400 uppercase">
                Marine Intelligence
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded border border-cyan-900/60 bg-slate-900/60 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-mono-code font-bold tracking-widest text-cyan-500/70">
                {group.label}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id as NavSection)}
                  className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active vertical glow indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {/* Special tags or badges */}
                  {!isCollapsed && item.highlight && (
                    <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                      CORE
                    </span>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500/90 text-[10px] font-mono-code text-white px-1 font-bold ${
                        isCollapsed ? 'absolute -top-1 -right-1' : ''
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Operational Status Footer */}
      <div className="border-t border-cyan-950/70 p-3 bg-slate-950/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono-code font-semibold tracking-wider text-emerald-300">
                  ALL SYSTEMS OPERATIONAL
                </span>
                <span className="text-[9px] font-mono-code text-slate-400">
                  Latency: 14ms • Pings: 452k
                </span>
              </div>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
        ) : (
          <div className="flex justify-center" title="System Operational (14ms)">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
