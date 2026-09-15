'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { api, BackendReport } from '../lib/api';

interface ReportsViewProps {
  detections: Detection[];
}

export default function ReportsView({ detections }: ReportsViewProps) {
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BackendReport | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDetectionId, setSelectedDetectionId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.list(1, 100);
      setReports(res.items || []);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const detectionId = selectedDetectionId ? parseInt(selectedDetectionId, 10) : undefined;
      await api.reports.create({
        title: title.trim(),
        description: description.trim() || undefined,
        detection_id: isNaN(detectionId as number) ? undefined : detectionId,
      });

      setStatusMessage('Report successfully registered in mission database.');
      setTitle('');
      setDescription('');
      setSelectedDetectionId('');
      setShowCreateModal(false);
      await loadReports();
    } catch (err: any) {
      alert('Failed to create report: ' + (err.message || 'Unknown error'));
    } finally {
      setCreating(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mission report?')) return;
    try {
      await api.reports.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err: any) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const exportReportTXT = (report: BackendReport) => {
    const linkedDetection = detections.find(d => d.numericId === report.detection_id || d.id === String(report.detection_id));
    const content = `===============================================================
PULSEDEPTH TACTICAL SURVEY MISSION REPORT
===============================================================
REPORT ID:      REP-${report.id.toString().padStart(4, '0')}
DATE CREATED:   ${new Date(report.created_at).toUTCString()}
STATUS:         ${report.status.toUpperCase()}
TITLE:          ${report.title}

MISSION DEBRIEF / SUMMARY:
${report.description || 'No operational debrief narrative attached.'}

---------------------------------------------------------------
LINKED ACOUSTIC DETECTION DETAILS:
---------------------------------------------------------------
${linkedDetection ? `
Detection ID:      ${linkedDetection.id}
Category:          ${linkedDetection.category.toUpperCase()}
Confidence:        ${linkedDetection.confidence}%
Risk Assessment:   ${linkedDetection.riskLevel || linkedDetection.priority}
Depth:             ${linkedDetection.depth ?? 'N/A'} m
Range:             ${linkedDetection.range ?? 'N/A'} m
Coordinates:       Lat ${linkedDetection.coordinates?.lat ?? 'N/A'}, Lng ${linkedDetection.coordinates?.lng ?? 'N/A'}
` : 'No individual detection anomaly linked (General Mission Summary).'}

===============================================================
AUTHENTICATED OPERATOR VERIFIED // PULSEDEPTH SYSTEM
===============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PULSEDEPTH_REPORT_${report.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportGeoJSON = (report: BackendReport) => {
    const linkedDetection = detections.find(d => d.numericId === report.detection_id || d.id === String(report.detection_id));
    const features = linkedDetection && linkedDetection.coordinates ? [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [linkedDetection.coordinates.lng, linkedDetection.coordinates.lat],
      },
      properties: {
        report_id: report.id,
        title: report.title,
        detection_id: linkedDetection.id,
        category: linkedDetection.category,
        confidence: linkedDetection.confidence,
        risk_level: linkedDetection.riskLevel || linkedDetection.priority,
        depth: linkedDetection.depth,
      },
    }] : detections.filter(d => d.coordinates).map(d => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.coordinates!.lng, d.coordinates!.lat],
      },
      properties: {
        detection_id: d.id,
        category: d.category,
        confidence: d.confidence,
        risk_level: d.riskLevel || d.priority,
      },
    }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PULSEDEPTH_REPORT_${report.id}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code font-bold uppercase tracking-wider mb-2">
            <FileText className="h-3 w-3 text-cyan-400" />
            <span>INCIDENT LOGGING & TACTICAL DOSSIERS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono-code text-white tracking-tight">
            MISSION REPORTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate, archive, and export official maritime survey reports directly from detection telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-400 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono-code text-xs transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>CREATE REPORT</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-mono-code flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Reports Grid & Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono-code text-xs">
          <div className="inline-block h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div>Loading mission reports from database...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cyan-900/60 bg-slate-900/30 p-12 text-center">
          <FileText className="h-10 w-10 text-cyan-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold font-mono-code text-white">NO REPORTS GENERATED YET</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            You can create a structured survey report for your logged seabed detections to export dossiers or share compliance data.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono-code font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>CREATE FIRST REPORT</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const linked = detections.find(d => d.numericId === report.detection_id || d.id === String(report.detection_id));
            return (
              <div
                key={report.id}
                className="rounded-xl border border-cyan-900/50 bg-slate-900/70 p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-colors backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono-code text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      REP-{report.id.toString().padStart(4, '0')}
                    </span>
                    <span className="text-[10px] font-mono-code text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                      {report.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-mono-code text-white mt-2 line-clamp-1">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {report.description || 'No operator description attached to this report.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-cyan-950/80 flex flex-col gap-1.5 text-[11px] font-mono-code text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>LINKED OBJECT:</span>
                      <span className="text-cyan-300 font-bold">
                        {linked ? `${linked.category.toUpperCase()} (${linked.id})` : report.detection_id ? `DET-${report.detection_id}` : 'General Sector'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TIMESTAMP:</span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-1.5 rounded hover:bg-cyan-950 text-cyan-400 transition-colors"
                      title="View Dossier"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => exportReportTXT(report)}
                      className="p-1.5 rounded hover:bg-cyan-950 text-slate-300 transition-colors"
                      title="Download TXT Debrief"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => exportGeoJSON(report)}
                      className="p-1.5 rounded hover:bg-cyan-950 text-slate-300 text-[10px] font-mono-code font-bold px-1"
                      title="Download GeoJSON"
                    >
                      GEOJSON
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-1.5 rounded hover:bg-red-950/60 text-red-400 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Dossier Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-xl border border-cyan-500/50 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
              <div>
                <span className="text-[10px] font-mono-code text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  REP-{selectedReport.id.toString().padStart(4, '0')}
                </span>
                <h3 className="text-lg font-black font-mono-code text-white mt-1">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono-code">
              <div>
                <div className="text-slate-400 font-bold mb-1">OPERATIONAL DESCRIPTION / DEBRIEF:</div>
                <div className="p-3 rounded-lg border border-cyan-950 bg-slate-950 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description || 'No description provided.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg border border-cyan-950 bg-slate-950">
                  <div className="text-[10px] text-slate-400">STATUS</div>
                  <div className="text-emerald-400 font-bold mt-0.5">{selectedReport.status.toUpperCase()}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-cyan-950 bg-slate-950">
                  <div className="text-[10px] text-slate-400">GENERATED AT</div>
                  <div className="text-white mt-0.5">{new Date(selectedReport.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-cyan-950">
              <button
                onClick={() => exportReportTXT(selectedReport)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-900 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono-code"
              >
                <Download className="h-3.5 w-3.5" />
                <span>EXPORT TXT</span>
              </button>
              <button
                onClick={() => exportGeoJSON(selectedReport)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono-code font-bold"
              >
                <span>EXPORT GEOJSON</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono-code"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl border border-cyan-500/50 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-black font-mono-code text-white">CREATE MISSION REPORT</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  REPORT TITLE <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SECTOR 07 GHOST NET SURVEILLANCE REPORT"
                  className="w-full px-3 py-2 rounded-lg border border-cyan-900 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ASSOCIATE DETECTION (OPTIONAL)
                </label>
                <select
                  value={selectedDetectionId}
                  onChange={(e) => setSelectedDetectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cyan-900 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- General Mission Overview (No Single Target) --</option>
                  {detections.map((d) => (
                    <option key={d.id} value={d.numericId || d.id}>
                      [{d.id}] {d.category.toUpperCase()} • Conf {d.confidence}% • {d.riskLevel || d.priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  TACTICAL DEBRIEF / OPERATOR NOTES
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed acoustic observations, water conditions, towfish telemetry, and risk notes..."
                  className="w-full px-3 py-2 rounded-lg border border-cyan-900 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cyan-950">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-400 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
                >
                  {creating ? <span>SAVING...</span> : <span>SAVE REPORT</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
