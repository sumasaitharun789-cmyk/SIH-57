'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Bell,
  Settings,
  User,
  Clock,
  Gauge,
  Waves,
  Navigation,
  Menu,
  LogOut,
  LogIn,
} from 'lucide-react';
import { TelemetryData } from '../lib/types';
import { toggleAudioMute, getAudioMuteState, playSonarPing } from '../lib/audioUtils';
import { UserProfile } from '../lib/api';

interface TopbarProps {
  telemetry: TelemetryData;
  onToggleAlerts: () => void;
  onToggleSettings: () => void;
  onToggleSidebarMobile?: () => void;
  unreadAlertsCount: number;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export default function Topbar({
  telemetry,
  onToggleAlerts,
  onToggleSettings,
  onToggleSidebarMobile,
  unreadAlertsCount,
  currentUser,
  onOpenAuth,
  onLogout,
}: TopbarProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(getAudioMuteState());

    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAudioToggle = () => {
    const newState = toggleAudioMute();
    setIsMuted(newState);
    if (!newState) {
      playSonarPing(980, 0.4);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-cyan-950/70 bg-[#060e1e]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left side: Telemetry & Status */}
      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar py-1">
        {onToggleSidebarMobile && (
          <button
            onClick={onToggleSidebarMobile}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded border border-cyan-900/60 bg-slate-900/60 text-slate-300"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Mission ID & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-800/40">
            <span className="text-[10px] font-mono-code text-cyan-400 font-bold uppercase tracking-wider">
              MISSION:
            </span>
            <span className="text-xs font-mono-code font-extrabold text-slate-100">
              {telemetry.missionId}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[10px] font-mono-code font-bold text-emerald-300 tracking-wider">
              {telemetry.status}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden xl:block h-6 w-px bg-cyan-950/80" />

        {/* Vessel & Survey Area */}
        <div className="hidden lg:flex items-center gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Navigation className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono-code uppercase text-slate-500">VESSEL:</span>
            <span className="font-medium text-slate-200">{telemetry.vesselName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] font-mono-code uppercase text-slate-500">SURVEY:</span>
            <span className="font-mono-code text-cyan-300">{telemetry.surveyArea}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-cyan-950/80" />

        {/* Sonar Sensor Metrics */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono-code">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400">DEPTH:</span>
            <span className="font-bold text-slate-100">{telemetry.depth.toFixed(1)} m</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400">SONAR:</span>
            <span className="font-bold text-cyan-300">{telemetry.sonarFrequency} kHz</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-slate-400">SIGNAL:</span>
            <span className="font-bold text-emerald-400">{telemetry.signalQuality}%</span>
          </div>
        </div>
      </div>

      {/* Right side: Audio Ping, Alerts, Settings, Profile, Clock */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 pl-2">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 rounded bg-slate-950/70 px-2.5 py-1 text-xs font-mono-code text-cyan-300 border border-cyan-900/50">
          <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>{timeStr || '11:26:04 UTC'}</span>
        </div>

        {/* Audio Ping Mute/Unmute */}
        <button
          onClick={handleAudioToggle}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
            isMuted
              ? 'border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300'
              : 'border-cyan-800/60 bg-cyan-950/40 text-cyan-300 hover:border-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
          }`}
          title={isMuted ? 'Acoustic Sound: Muted' : 'Acoustic Sound: Active'}
          aria-label={isMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Alerts Button */}
        <button
          onClick={onToggleAlerts}
          className="relative flex h-8 w-8 items-center justify-center rounded border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
          title="Mission Alerts"
          aria-label="Mission Alerts"
        >
          <Bell className="h-4 w-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-mono-code font-bold text-white px-1">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
          title="Telemetry & Sonar Settings"
          aria-label="Telemetry & Sonar Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Operator Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-mono-code font-bold text-xs"
                title={`Logged in as ${currentUser.username} (${currentUser.email})`}
              >
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.username}
                </span>
                <span className="text-[10px] font-mono-code text-cyan-400 leading-tight">
                  Operator • ID #{currentUser.id}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-900/80 transition-colors"
                  title="Sign out / Switch operator"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-semibold text-slate-300 leading-tight">
                  Guest Operator
                </span>
                <span className="text-[10px] font-mono-code text-slate-500 leading-tight">
                  Read-Only Mode
                </span>
              </div>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
                  title="Sign in to authenticate"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
