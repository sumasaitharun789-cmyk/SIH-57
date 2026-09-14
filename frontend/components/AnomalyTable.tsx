'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Database,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Detection, PriorityLevel, VerificationStatus } from '../lib/types';

interface AnomalyTableProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (detection: Detection) => void;
  onOpenDetailsModal: (detection: Detection) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  error?: string | null;
}

type SortField = 'id' | 'confidence' | 'depth' | 'timestamp' | 'fusedConfidence';

export default function AnomalyTable({
  detections,
  selectedDetection,
  onSelectDetection,
  onOpenDetailsModal,
  isLoading,
  onRefresh,
  error,
}: AnomalyTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort
  const filteredDetections = useMemo(() => {
    return detections
      .filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);

        const matchesPriority =
          priorityFilter === 'ALL' || item.priority === priorityFilter;

        const matchesStatus =
          statusFilter === 'ALL' || item.status === statusFilter;

        return matchesQuery && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [detections, searchQuery, priorityFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Category',
      'Confidence',
      'FusedConfidence',
      'Priority',
      'Status',
      'Depth(m)',
      'Range(m)',
      'Latitude',
      'Longitude',
      'Timestamp',
    ];
    const rows = filteredDetections.map((d) => [
      d.id,
      `"${d.name}"`,
      `"${d.category}"`,
      d.confidence,
      d.fusedConfidence,
      d.priority,
      d.status,
      d.depth,
      d.range,
      d.coordinates.lat,
      d.coordinates.lng,
      `"${d.timestamp}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulsedepth_anomalies_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md shadow-xl">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              ANOMALY DATABASE
            </h3>
            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {filteredDetections.length} RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical side-scan contacts registered with fused acoustic confirmation.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-500 hover:bg-cyan-900/40 transition-colors disabled:opacity-50"
              title="Sync detections from FastAPI SQLite database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>SYNC DATABASE</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-cyan-700/50 bg-cyan-950/40 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>EXPORT CSV / GIS</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-900/80 bg-red-950/40 p-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="underline text-red-200 hover:text-white text-xs font-mono-code"
            >
              Retry Sync
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search anomaly ID, type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono-code text-slate-400">PRIORITY:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs text-slate-300 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono-code text-slate-400">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs text-slate-300 focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="REVIEW">Under Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="bg-[#0c1a2e] text-[11px] text-cyan-400 uppercase tracking-wider border-b border-slate-800 select-none">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="px-4 py-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  ID <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3">TYPE</th>
              <th
                onClick={() => handleSort('fusedConfidence')}
                className="px-4 py-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  FUSED CONF <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('depth')}
                className="px-4 py-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  DEPTH <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3">POSITION (LAT, LNG)</th>
              <th className="px-4 py-3">PRIORITY</th>
              <th className="px-4 py-3">STATUS</th>
              <th
                onClick={() => handleSort('timestamp')}
                className="px-4 py-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  TIME <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                    <span className="text-xs font-mono-code">Syncing anomaly records from SQLite database...</span>
                  </div>
                </td>
              </tr>
            ) : detections.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database className="h-8 w-8 text-slate-600" />
                    <span className="text-sm font-bold text-slate-300">NO ANOMALY RECORDS IN DATABASE</span>
                    <span className="text-xs text-slate-500 max-w-sm">
                      No side-scan sonar contacts have been logged yet. Upload a sonar image in the &quot;Upload Sonar&quot; module to run ML detection.
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredDetections.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No anomaly contacts match your current search criteria.
                </td>
              </tr>
            ) : (
              filteredDetections.map((det) => {
                const isSelected = selectedDetection?.id === det.id;

                const priorityBadge =
                  det.priority === 'HIGH'
                    ? 'text-red-400 bg-red-950/80 border-red-800/80'
                    : det.priority === 'MEDIUM'
                    ? 'text-amber-400 bg-amber-950/80 border-amber-800/80'
                    : 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80';

                const statusBadge =
                  det.status === 'VERIFIED'
                    ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                    : det.status === 'REVIEW'
                    ? 'text-amber-400 bg-amber-950/80 border-amber-800/80'
                    : 'text-slate-400 bg-slate-800 border-slate-700';

                return (
                  <tr
                    key={det.id}
                    onClick={() => onSelectDetection(det)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/50 text-white'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-bold text-cyan-300 whitespace-nowrap">
                      {det.id}
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3 font-medium text-slate-100 whitespace-nowrap">
                      {det.name}
                    </td>

                    {/* CONFIDENCE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${det.fusedConfidence}%` }}
                            className="h-full rounded-full bg-emerald-400"
                          />
                        </div>
                        <span className="font-bold text-emerald-400">
                          {det.fusedConfidence}%
                        </span>
                      </div>
                    </td>

                    {/* DEPTH */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {det.depth.toFixed(1)}m
                    </td>

                    {/* POSITION */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {det.coordinates.lat.toFixed(4)}, {det.coordinates.lng.toFixed(4)}
                    </td>

                    {/* PRIORITY */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${priorityBadge}`}
                      >
                        {det.priority}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}
                      >
                        {det.status}
                      </span>
                    </td>

                    {/* TIME */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {det.timestamp.split(' ')[1]}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetailsModal(det);
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-950 border border-transparent hover:border-cyan-800 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
