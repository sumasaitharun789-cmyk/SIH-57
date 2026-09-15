'use client';

import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Detection } from '../lib/types';

interface DetectionsViewProps {
  detections: Detection[];
  onSelectDetection: (det: Detection) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function DetectionsView({
  detections,
  onSelectDetection,
  onRefresh,
  isLoading,
}: DetectionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter
  const filtered = useMemo(() => {
    return detections.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);

      const matchesType =
        typeFilter === 'ALL' || d.category.toLowerCase().includes(typeFilter.toLowerCase());

      const matchesRisk = riskFilter === 'ALL' || d.priority === riskFilter;

      let matchesConf = true;
      if (confidenceFilter === '90') matchesConf = d.confidence >= 90;
      else if (confidenceFilter === '80') matchesConf = d.confidence >= 80;
      else if (confidenceFilter === '70') matchesConf = d.confidence >= 70;

      return matchesQuery && matchesType && matchesRisk && matchesConf;
    });
  }, [detections, searchQuery, typeFilter, confidenceFilter, riskFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleReset = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setConfidenceFilter('ALL');
    setRiskFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code font-bold uppercase tracking-wider mb-2">
            <Database className="h-3 w-3 text-cyan-400" />
            <span>CATALOG & REPOSITORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono-code text-white tracking-tight">
            DETECTIONS
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono-code tracking-wider text-cyan-400">
            PAGINATED ACOUSTIC CONTACT DATABASE
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-800 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 text-xs font-mono-code font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="SEARCH BY ID, NAME, OR CLASS..."
            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-9 pr-3 py-2 text-xs font-mono-code text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-code">
          {/* Object Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">TYPE:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="net">GHOST NETS</option>
              <option value="ship">SHIPWRECKS</option>
              <option value="gear">FISHING GEAR</option>
              <option value="pipe">PIPES / CYLINDERS</option>
              <option value="debris">OTHER DEBRIS</option>
            </select>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">CONFIDENCE:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => {
                setConfidenceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL</option>
              <option value="90">≥ 90%</option>
              <option value="80">≥ 80%</option>
              <option value="70">≥ 70%</option>
            </select>
          </div>

          {/* Risk */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">RISK:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL RISKS</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-[10px] uppercase font-bold transition-colors cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-xs">
            <thead>
              <tr className="border-b border-cyan-950/80 bg-[#040e1c] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">OBJECT</th>
                <th className="py-3.5 px-4">CONFIDENCE</th>
                <th className="py-3.5 px-4">RISK</th>
                <th className="py-3.5 px-4">LATITUDE</th>
                <th className="py-3.5 px-4">LONGITUDE</th>
                <th className="py-3.5 px-4">DATE/TIME</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/50">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono-code">
                    NO MATCHING DETECTIONS FOUND
                  </td>
                </tr>
              ) : (
                paginatedItems.map((d) => {
                  const isHigh = d.priority === 'HIGH';
                  const isMed = d.priority === 'MEDIUM';
                  return (
                    <tr
                      key={d.id}
                      onClick={() => onSelectDetection(d)}
                      className="hover:bg-cyan-950/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        {d.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {d.category}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">
                        {d.confidence}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                              : isMed
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                          }`}
                        >
                          {d.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {d.coordinates.lat.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {d.coordinates.lng.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400">
                        {d.timestamp.includes('GMT') || d.timestamp.includes('UTC')
                          ? d.timestamp.split(' ').slice(0, 4).join(' ')
                          : d.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDetection(d);
                          }}
                          className="px-3 py-1 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-cyan-950/80 bg-[#040e1c] flex items-center justify-between text-xs font-mono-code text-slate-400">
          <div>
            SHOWING {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} OF {filtered.length} DETECTIONS
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-white px-2">
              PAGE {currentPage} OF {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-opacity cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
