'use client';

import React, { useState } from 'react';
import {
  Settings,
  X,
  Sliders,
  Radio,
  Volume2,
  ShieldAlert,
  Server,
  Save,
  RotateCcw,
} from 'lucide-react';
import { SonarPalette, TelemetryData } from '../lib/types';
import { toggleAudioMute, getAudioMuteState } from '../lib/audioUtils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryData;
  onUpdateTelemetry: (updates: Partial<TelemetryData>) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  telemetry,
  onUpdateTelemetry,
}: SettingsPanelProps) {
  const [frequency, setFrequency] = useState<455 | 900>(telemetry.sonarFrequency);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75);
  const [filterMode, setFilterMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api/v1');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(!getAudioMuteState());
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateTelemetry({ sonarFrequency: frequency });
    toggleAudioMute(!audioEnabled);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-950/90 bg-[#0a1628] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#060e1e] px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              HYDROGRAPHIC SYSTEM SETTINGS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs font-mono-code">
          {/* Frequency Selector */}
          <div className="space-y-2">
            <label className="text-slate-300 font-bold flex items-center justify-between">
              <span>SONAR ACOUSTIC FREQUENCY</span>
              <span className="text-cyan-400">{frequency} kHz</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFrequency(455)}
                className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                  frequency === 455
                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                455 kHz (Wide Swath / Long Range)
              </button>
              <button
                type="button"
                onClick={() => setFrequency(900)}
                className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                  frequency === 900
                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                900 kHz (Ultra High-Res Target Detail)
              </button>
            </div>
          </div>

          {/* Minimum Confidence Threshold Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>DETECTION SENSITIVITY THRESHOLD</span>
              <span className="text-cyan-400">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>50% (High Recall)</span>
              <span>75% (Balanced Standard)</span>
              <span>95% (Extreme Precision)</span>
            </div>
          </div>

          {/* False-Positive Filtering Policy */}
          <div className="space-y-2">
            <label className="text-slate-300 font-bold">EVIDENCE FUSION STRICTNESS</label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'balanced', 'aggressive'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`py-2 rounded-lg border capitalize text-center text-[11px] transition-colors ${
                    filterMode === mode
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Tactical Audio Alert Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-slate-200 font-bold">TACTICAL SONAR SOUND</div>
              <div className="text-[10px] text-slate-400">
                Play acoustic ping synthesizer on contacts & sweeps
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                audioEnabled
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {audioEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Backend API Endpoint */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-slate-300 font-bold flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>PYTHON FASTAPI ENDPOINT (BACKEND READY)</span>
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-cyan-950/80 bg-[#060e1e] px-6 py-4">
          {savedNotice ? (
            <span className="text-xs font-mono-code text-emerald-400 font-bold">
              ✓ SETTINGS APPLIED!
            </span>
          ) : (
            <span className="text-[10px] font-mono-code text-slate-500">
              Changes apply across all active monitors
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>APPLY CHANGES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
