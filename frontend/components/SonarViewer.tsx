'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Layers,
  Crosshair,
  Compass,
} from 'lucide-react';
import { Detection, SonarPalette, TelemetryData } from '../lib/types';
import { playSonarPing } from '../lib/audioUtils';

interface SonarViewerProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (detection: Detection) => void;
  telemetry: TelemetryData;
}

export default function SonarViewer({
  detections,
  selectedDetection,
  onSelectDetection,
  telemetry,
}: SonarViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [palette, setPalette] = useState<SonarPalette>('cyan');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [gainDb, setGainDb] = useState<number>(telemetry.gainDb || 3.5);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showRings, setShowRings] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sweepY, setSweepY] = useState<number>(0);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  const gainSliderId = useId();

  // Draw procedural acoustic side-scan sonar waterfall on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let localSweep = sweepY;

    // Palette color ramps
    const getPaletteColor = (intensity: number, pal: SonarPalette): string => {
      // intensity is 0 to 1
      const gainAdj = Math.min(1, Math.max(0, intensity * (gainDb / 3.0)));

      if (pal === 'copper') {
        // Classic amber/copper side-scan sonar
        const r = Math.floor(gainAdj * 255);
        const g = Math.floor(gainAdj * 180 * 0.9);
        const b = Math.floor(gainAdj * 50 * 0.6);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (pal === 'cyan') {
        // Deep midnight cyan
        const r = Math.floor(gainAdj * 30);
        const g = Math.floor(gainAdj * 215);
        const b = Math.floor(gainAdj * 240);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (pal === 'emerald') {
        // High-contrast thermal green
        const r = Math.floor(gainAdj * 20);
        const g = Math.floor(gainAdj * 230);
        const b = Math.floor(gainAdj * 120);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Monochrome grayscale
        const v = Math.floor(gainAdj * 240);
        return `rgb(${v}, ${v}, ${v})`;
      }
    };

    const renderSonarScene = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Fill background
      ctx.fillStyle = '#02050c';
      ctx.fillRect(0, 0, width, height);

      const midX = width / 2;
      const nadirWidth = 44; // Blind water column under the towfish

      // Render acoustic seabed backscatter with procedural noise
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      // Seeded-like noise pattern
      for (let y = 0; y < height; y += 2) {
        const rowSweepDist = Math.abs(y - localSweep);
        const isNearSweep = rowSweepDist < 18;
        const sweepBoost = isNearSweep ? (1 - rowSweepDist / 18) * 0.45 : 0;

        for (let x = 0; x < width; x += 2) {
          // Check nadir track (center water column - very low backscatter, acoustic shadow of towfish)
          const distFromNadir = Math.abs(x - midX);
          let intensity = 0;

          if (distFromNadir < nadirWidth / 2) {
            // Nadir blind zone (water column return: mostly black with occasional fish/plankton speckles)
            intensity = 0.04 + Math.random() * 0.05;
          } else {
            // Seabed backscatter
            const sandRipple = Math.sin((x * 0.08) + (y * 0.03)) * 0.12;
            const acousticSpeckle = (Math.random() - 0.5) * 0.28;
            // Far range falloff (TVG - Time Varied Gain simulation)
            const rangeFactor = Math.max(0.2, 1 - (distFromNadir / midX) * 0.35);

            intensity = (0.35 + sandRipple + acousticSpeckle + sweepBoost) * rangeFactor;
            intensity = Math.max(0.02, Math.min(0.98, intensity));
          }

          // Check if pixel falls inside any detection's highlight or acoustic shadow
          for (const det of detections) {
            const isPort = det.track === 'Port';
            const channelX = isPort
              ? (det.sonarBoundingBox.x / 100) * (midX - nadirWidth / 2)
              : midX + nadirWidth / 2 + (det.sonarBoundingBox.x / 100) * (midX - nadirWidth / 2);
            const channelY = (det.sonarBoundingBox.y / 100) * height;
            const boxW = (det.sonarBoundingBox.width / 100) * (midX - nadirWidth / 2);
            const boxH = (det.sonarBoundingBox.height / 100) * height;

            // Highlight target body (strong specular reflection)
            if (x >= channelX && x <= channelX + boxW && y >= channelY && y <= channelY + boxH) {
              intensity = Math.min(1.0, intensity + 0.55 + Math.random() * 0.25);
            }

            // Cast acoustic shadow (dark void extending radially outward from towfish)
            const shadowLen = (det.sonarBoundingBox.shadowLength / 100) * (midX - nadirWidth / 2);
            const shadowXStart = isPort ? channelX - shadowLen : channelX + boxW;
            const shadowXEnd = isPort ? channelX : channelX + boxW + shadowLen;

            if (
              x >= shadowXStart &&
              x <= shadowXEnd &&
              y >= channelY - 2 &&
              y <= channelY + boxH + 2
            ) {
              intensity = 0.02 + Math.random() * 0.03; // Very low acoustic return
            }
          }

          // Convert intensity to RGBA according to selected palette
          let r = 0,
            g = 0,
            b = 0;
          const gainAdj = Math.min(1, Math.max(0, intensity * (gainDb / 3.2)));

          if (palette === 'copper') {
            r = Math.floor(gainAdj * 255);
            g = Math.floor(gainAdj * 185 * 0.9);
            b = Math.floor(gainAdj * 45 * 0.6);
          } else if (palette === 'cyan') {
            r = Math.floor(gainAdj * 25);
            g = Math.floor(gainAdj * 210);
            b = Math.floor(gainAdj * 245);
          } else if (palette === 'emerald') {
            r = Math.floor(gainAdj * 20);
            g = Math.floor(gainAdj * 235);
            b = Math.floor(gainAdj * 120);
          } else {
            const v = Math.floor(gainAdj * 240);
            r = v;
            g = v;
            b = v;
          }

          // Fill 2x2 block for crisp performance
          for (let dy = 0; dy < 2 && y + dy < height; dy++) {
            for (let dx = 0; dx < 2 && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw Center Nadir Track Line
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, height);
      ctx.stroke();

      // Nadir boundaries
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(midX - nadirWidth / 2, 0);
      ctx.lineTo(midX - nadirWidth / 2, height);
      ctx.moveTo(midX + nadirWidth / 2, 0);
      ctx.lineTo(midX + nadirWidth / 2, height);
      ctx.stroke();

      // Range Rings / Crosshairs if enabled
      if (showRings) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        const rangeSteps = [0.25, 0.5, 0.75, 1.0];
        rangeSteps.forEach((step) => {
          const rPort = (midX - nadirWidth / 2) * step;
          const rStbd = (midX - nadirWidth / 2) * step;

          // Port range vertical line
          ctx.beginPath();
          ctx.moveTo(midX - nadirWidth / 2 - rPort, 0);
          ctx.lineTo(midX - nadirWidth / 2 - rPort, height);
          ctx.stroke();

          // Starboard range vertical line
          ctx.beginPath();
          ctx.moveTo(midX + nadirWidth / 2 + rStbd, 0);
          ctx.lineTo(midX + nadirWidth / 2 + rStbd, height);
          ctx.stroke();
        });
      }

      // Range horizontal grid if enabled
      if (showGrid) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        for (let y = 50; y < height; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Draw active ping sweep line
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, localSweep);
      ctx.lineTo(width, localSweep);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Advance sweep line
      if (isPlaying) {
        localSweep = (localSweep + 1.8) % height;
        setSweepY(localSweep);
      }

      animationFrameId = requestAnimationFrame(renderSonarScene);
    };

    renderSonarScene();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [palette, isPlaying, gainDb, showGrid, showRings, detections]);

  // Keyboard shortcuts for Sonar Waterfall
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === '1') {
        setPalette('cyan');
      } else if (e.key === '2') {
        setPalette('copper');
      } else if (e.key === '3') {
        setPalette('monochrome');
      } else if (e.key === '4') {
        setPalette('emerald');
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-xl border border-cyan-950/80 bg-[#060e1e] overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Top HUD: Status, Controls, and Channel Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-950/80 bg-[#0a1628]/90 px-4 py-3 backdrop-blur-md">
        {/* Left: Tactical Mode Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-cyan-300">
              SIDE-SCAN ACOUSTIC SWATH
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono-code text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {telemetry.sonarFrequency} kHz DUAL • 18 Hz PING
          </span>

          <span className="hidden md:inline-block text-[11px] font-mono-code text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
            TVG SLANT-CORRECTED
          </span>
        </div>

        {/* Center: Channel Indicators */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-mono-code">
          <span className="font-bold text-cyan-400 tracking-wider">◄ PORT CHANNEL (75m)</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Crosshair className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>NADIR TRACK (0m)</span>
          </div>
          <span className="font-bold text-cyan-400 tracking-wider">STARBOARD CHANNEL (75m) ►</span>
        </div>

        {/* Right: Controls (Palette, Zoom, Play/Pause, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Palette Selector */}
          <div className="flex items-center rounded-lg border border-cyan-900/60 bg-slate-950/60 p-0.5 text-[10px] font-mono-code">
            {(['cyan', 'copper', 'monochrome', 'emerald'] as SonarPalette[]).map((pal) => (
              <button
                key={pal}
                onClick={() => setPalette(pal)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  palette === pal
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pal === 'copper' ? 'Amber' : pal}
              </button>
            ))}
          </div>

          {/* Gain slider popover/control */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-slate-800 bg-slate-950/60 text-xs font-mono-code">
            <label htmlFor={gainSliderId} className="text-[10px] text-slate-400 cursor-pointer">
              GAIN:
            </label>
            <input
              id={gainSliderId}
              type="range"
              min="1.0"
              max="6.0"
              step="0.5"
              value={gainDb}
              onChange={(e) => setGainDb(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 cursor-pointer"
              aria-label="Acoustic Sonar Gain"
            />
            <span className="text-[10px] text-cyan-300 font-bold">{gainDb.toFixed(1)}dB</span>
          </div>

          {/* Play/Pause Sweep */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying) playSonarPing(880, 0.3);
            }}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
            title={isPlaying ? 'Pause sweep' : 'Resume sweep'}
            aria-label={isPlaying ? 'Pause sweep' : 'Resume sweep'}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas + Interactive Overlay Container */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] max-h-[560px] overflow-hidden bg-black select-none">
        {/* Procedural Sonar Canvas */}
        <canvas
          ref={canvasRef}
          width={840}
          height={480}
          className="h-full w-full object-cover"
        />

        {/* Tactical Scanlines & CRT Mesh */}
        <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />

        {/* Range Scale Overlay (Horizontal Top Axis) */}
        <div className="pointer-events-none absolute top-2 left-0 right-0 flex justify-between px-6 text-[10px] font-mono-code text-cyan-400/80">
          <span>75m (PORT)</span>
          <span>50m</span>
          <span>25m</span>
          <span className="text-cyan-300 font-bold">0m (NADIR)</span>
          <span>25m</span>
          <span>50m</span>
          <span>75m (STBD)</span>
        </div>

        {/* Interactive Bounding Boxes Overlaid on Canvas */}
        {detections.map((det) => {
          const isSelected = selectedDetection?.id === det.id;
          const isHovered = hoveredBoxId === det.id;
          const isPort = det.track === 'Port';

          // Position computation based on 50% split with nadir
          // 48% port, 4% nadir, 48% stbd
          const leftPct = isPort
            ? (det.sonarBoundingBox.x / 100) * 48
            : 52 + (det.sonarBoundingBox.x / 100) * 48;
          const topPct = det.sonarBoundingBox.y;

          const priorityBorder =
            det.priority === 'HIGH'
              ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : det.priority === 'MEDIUM'
              ? 'border-amber-500/80 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'border-cyan-500/70 bg-cyan-500/10';

          return (
            <div
              key={det.id}
              onClick={() => onSelectDetection(det)}
              onMouseEnter={() => setHoveredBoxId(det.id)}
              onMouseLeave={() => setHoveredBoxId(null)}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${Math.max(12, det.sonarBoundingBox.width * 0.48)}%`,
                height: `${Math.max(14, det.sonarBoundingBox.height)}%`,
              }}
              className={`absolute cursor-pointer rounded border-2 transition-all duration-200 z-10 ${priorityBorder} ${
                isSelected ? 'ring-2 ring-white scale-105 z-20' : 'hover:scale-105'
              }`}
            >
              {/* Corner reticle marks */}
              <div className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-white" />

              {/* Tag Label */}
              <div
                className={`absolute -top-6 left-0 flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold whitespace-nowrap shadow ${
                  det.priority === 'HIGH'
                    ? 'bg-red-950 border border-red-500 text-red-300'
                    : 'bg-slate-900 border border-cyan-500 text-cyan-300'
                }`}
              >
                <span>{det.id}</span>
                <span>•</span>
                <span>{det.confidence}%</span>
              </div>

              {/* Hover Details Floating Tag */}
              {(isHovered || isSelected) && (
                <div className="absolute top-full left-0 mt-1.5 w-48 rounded-md bg-[#0a1628]/95 border border-cyan-500/60 p-2 text-[10px] font-mono-code text-slate-200 shadow-xl backdrop-blur-md z-30 pointer-events-none">
                  <div className="font-bold text-cyan-300 truncate">{det.name}</div>
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>Range: {det.range}m</span>
                    <span>Depth: {det.depth}m</span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-slate-400">Fused Conf:</span>
                    <span className="font-bold text-emerald-400">{det.fusedConfidence}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Water Column Nadir Center Marker */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-black/40 border-x border-cyan-500/20 flex flex-col items-center justify-center">
          <div className="text-[8px] font-mono-code text-cyan-400/40 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            TOWFISH NADIR ZONE
          </div>
        </div>
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-950/80 bg-[#0a1628]/90 px-4 py-2 text-xs font-mono-code text-slate-400">
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">
            ACTIVE TARGETS: <strong className="text-white">{detections.length}</strong>
          </span>
          <span className="hidden sm:inline-block">
            ALTITUDE: <strong className="text-slate-200">{telemetry.towfishAltitude}m</strong>
          </span>
          <span className="hidden md:inline-block">
            WATER TEMP: <strong className="text-slate-200">{telemetry.waterTemperatureC}°C</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            SYNCHRONIZED WITH EVIDENCE FUSION
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">CLICK CONTACT TO INSPECT</span>
        </div>
      </div>
    </div>
  );
}
