'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar, { NavSection } from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MissionOverview from '../components/MissionOverview';
import SonarViewer from '../components/SonarViewer';
import DetectionPanel from '../components/DetectionPanel';
import EvidenceFusion from '../components/EvidenceFusion';
import DetectionMap from '../components/DetectionMap';
import AnomalyTable from '../components/AnomalyTable';
import MissionAnalytics from '../components/MissionAnalytics';
import MissionTimeline from '../components/MissionTimeline';
import MissionHealth from '../components/MissionHealth';
import UploadSonar from '../components/UploadSonar';
import AlertPanel from '../components/AlertPanel';
import DetectionModal from '../components/DetectionModal';
import SettingsPanel from '../components/SettingsPanel';
import LandingIntro from '../components/LandingIntro';
import AuthModal from '../components/AuthModal';

import {
  initialTelemetry,
  initialStats,
  mockDetections,
  mockAlerts,
  mockTimeline,
} from '../lib/mockData';
import { Detection, TelemetryData, MissionStats, AlertItem } from '../lib/types';
import { playSonarPing, playAlertChime } from '../lib/audioUtils';
import {
  api,
  UserProfile,
  BackendReport,
  BackendDashboardSummary,
  BackendDetectionResponse,
  adaptBackendDetection,
} from '../lib/api';
import {
  Ship,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

export default function Home() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Auth & Session state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Backend Reports state
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState<boolean>(false);
  const [newReportTitle, setNewReportTitle] = useState<string>('');
  const [newReportDescription, setNewReportDescription] = useState<string>('');
  const [newReportDetectionId, setNewReportDetectionId] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Core domain state
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [stats, setStats] = useState<MissionStats>(initialStats);
  const [detections, setDetections] = useState<Detection[]>(mockDetections);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(
    mockDetections[0] // Default to DET-042 (Ghost Net)
  );
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [timelineEvents, setTimelineEvents] = useState(mockTimeline);

  // Modals state
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Backend Sync State
  const [dashboardSummary, setDashboardSummary] = useState<BackendDashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingDetections, setIsLoadingDetections] = useState<boolean>(false);
  const [detectionsError, setDetectionsError] = useState<string | null>(null);

  const fetchDashboardSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await api.dashboard.getSummary();
      setDashboardSummary(summary);
      setStats((prev) => ({
        ...prev,
        anomaliesDetected: Math.max(prev.anomaliesDetected, summary.total_detections),
        highPriorityCount: Math.max(prev.highPriorityCount, summary.risk_distribution.high),
      }));
    } catch (err: any) {
      console.warn('Dashboard summary fetch notice (using offline telemetry):', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchDetections = async () => {
    setIsLoadingDetections(true);
    setDetectionsError(null);
    try {
      const res = await api.detections.list(1, 50);
      if (res && res.items) {
        if (res.items.length > 0) {
          const adapted = res.items.map((d: BackendDetectionResponse) =>
            adaptBackendDetection(d, initialTelemetry)
          );
          setDetections(adapted);
          setSelectedDetection((prev) => {
            if (!prev) return adapted[0];
            const found = adapted.find((a) => a.id === prev.id);
            return found || adapted[0];
          });
        } else if (api.auth.isAuthenticated()) {
          // Authenticated user with no detections yet
          setDetections([]);
          setSelectedDetection(null);
        }
      }
    } catch (err: any) {
      console.warn('Backend detections fetch notice:', err);
      setDetectionsError(err?.message || 'Failed to fetch detections from server.');
    } finally {
      setIsLoadingDetections(false);
    }
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await api.reports.list(1, 50);
      setReports(data.items || []);
    } catch (err) {
      console.warn('Backend reports fetch notice:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchAllBackendData = () => {
    fetchDashboardSummary();
    fetchDetections();
    fetchReports();
  };

  // Sync with FastAPI Backend on Mount and on Auth State Changes
  useEffect(() => {
    const handleAuthChange = () => {
      const user = api.auth.getCachedUser();
      setCurrentUser(user);
      fetchAllBackendData();
    };

    window.addEventListener('pulsedepth_auth_change', handleAuthChange);

    // 1. Restore cached operator session if available
    const cached = api.auth.getCachedUser();
    if (cached) {
      setCurrentUser(cached);
    }
    if (api.auth.getToken()) {
      api.auth
        .getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          // Token expired or invalid
          setCurrentUser(null);
        });
    }

    // 2. Fetch all backend services
    fetchAllBackendData();

    return () => {
      window.removeEventListener('pulsedepth_auth_change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return;
    setIsSubmittingReport(true);
    try {
      const detIdNum = newReportDetectionId ? parseInt(newReportDetectionId, 10) : undefined;
      const created = await api.reports.create({
        title: newReportTitle.trim(),
        description: newReportDescription.trim() || undefined,
        detection_id: isNaN(detIdNum!) ? undefined : detIdNum,
      });
      setReports((prev) => [created, ...prev]);
      setNewReportTitle('');
      setNewReportDescription('');
      setNewReportDetectionId('');
      setIsCreateReportOpen(false);
      playSonarPing(1100, 0.3);
    } catch (err: any) {
      console.error('Report creation failed:', err);
      alert(err?.message || 'Failed to create report. Ensure you are signed in.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm(`Delete report #REP-00${id}?`)) return;
    try {
      await api.reports.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Delete report failed:', err);
      alert(err?.message || 'Failed to delete report.');
    }
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: detections.map((d) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [d.coordinates.lng, d.coordinates.lat],
        },
        properties: {
          id: d.id,
          name: d.name,
          category: d.category,
          priority: d.priority,
          status: d.status,
          depth: d.depth,
          range: d.range,
          confidence: d.confidence,
          fusedConfidence: d.fusedConfidence,
          timestamp: d.timestamp,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PulseDepth_Survey_Sector07_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSummaryPDF = () => {
    const reportText = `=====================================================
PULSEDEPTH MARINE DEBRIS SURVEY REPORT (IHO S-44 COMPLIANT)
=====================================================
Mission ID: ${telemetry.missionId}
Vessel: ${telemetry.vesselName} | Survey Area: ${telemetry.surveyArea}
Date: ${new Date().toISOString()}
Active Operator: ${currentUser ? currentUser.username : 'Dr. Priya Raman (Lead Hydrographer)'}
-----------------------------------------------------
STATISTICAL SUMMARY:
- Total Anomalies Cataloged: ${detections.length}
- High Priority Risks: ${stats.highPriorityCount}
- Vessel Bathymetric Depth: ${telemetry.depth.toFixed(1)} m
-----------------------------------------------------
CONFIRMED ACOUSTIC DETECTIONS:
${detections
  .map(
    (d, i) =>
      `[${i + 1}] ID: ${d.id} | ${d.name} (${d.category})
     Confidence: ${d.confidence}% (Fused: ${d.fusedConfidence}%) | Priority: ${d.priority} | Status: ${d.status}
     Coords: [Lat: ${d.coordinates.lat.toFixed(6)}, Lng: ${d.coordinates.lng.toFixed(6)}] | Depth: ${d.depth.toFixed(1)}m`
  )
  .join('\n\n')}
=====================================================`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PulseDepth_Executive_Summary_${telemetry.missionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle section selection
  const handleSelectSection = (section: NavSection) => {
    setCurrentSection(section);
    setIsMobileSidebarOpen(false);
  };

  // Select detection across components
  const handleSelectDetection = (det: Detection) => {
    setSelectedDetection(det);
    playSonarPing(1100, 0.25);
  };

  // Jump to detection from alert
  const handleSelectAlert = (detectionId: string) => {
    const target = detections.find((d) => d.id === detectionId);
    if (target) {
      setSelectedDetection(target);
      setCurrentSection('sonar');
      playAlertChime();
    }
  };

  // Handle newly uploaded and analyzed detection
  const handleNewDetectionAdded = (newDet: Detection) => {
    setDetections((prev) => [newDet, ...prev]);
    setSelectedDetection(newDet);
    setStats((prev) => ({
      ...prev,
      sonarScans: prev.sonarScans + 1,
      anomaliesDetected: prev.anomaliesDetected + 1,
      highPriorityCount:
        newDet.priority === 'HIGH' ? prev.highPriorityCount + 1 : prev.highPriorityCount,
    }));

    // Add alert
    const newAlert: AlertItem = {
      id: `ALT-${Date.now()}`,
      detectionId: newDet.id,
      title: `New Verified Contact: ${newDet.name}`,
      message: `Detected at ${newDet.depth.toFixed(1)}m with ${newDet.fusedConfidence}% fused confidence.`,
      priority: newDet.priority,
      timestamp: 'Just now',
      read: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    fetchDashboardSummary();
  };

  // Mark all alerts read
  const handleMarkAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  // Update detection status
  const handleStatusChange = (
    id: string,
    newStatus: 'VERIFIED' | 'REVIEW' | 'REJECTED'
  ) => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    if (selectedDetection && selectedDetection.id === id) {
      setSelectedDetection((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // If entry screen is active
  if (!hasEntered) {
    return (
      <>
        <LandingIntro
          onEnterDashboard={() => setHasEntered(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isAuthenticated={!!currentUser}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(user: UserProfile) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            setHasEntered(true);
            fetchAllBackendData();
          }}
        />
      </>
    );
  }

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-slate-100">
      {/* Permanent or Collapsible Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        unreadAlertCount={unreadAlertCount}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Tactical Operational Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Telemetry and Status HUD Bar */}
        <Topbar
          telemetry={telemetry}
          onToggleAlerts={() => setIsAlertsOpen(!isAlertsOpen)}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          unreadAlertsCount={unreadAlertCount}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 sonar-grid">
          {/* Animated Section Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* SECTION 1: MISSION OVERVIEW (Dashboard home) */}
              {currentSection === 'overview' && (
                <div className="space-y-6">
                  <MissionOverview
                    stats={stats}
                    telemetry={telemetry}
                    summary={dashboardSummary}
                    onNavigate={(sec) => setCurrentSection(sec)}
                  />

                  {/* Sonar Waterfall + Detection Panel Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                      <SonarViewer
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        telemetry={telemetry}
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <DetectionPanel
                        detection={selectedDetection}
                        onOpenModal={() => setIsDetailsModalOpen(true)}
                        onViewOnMap={() => setCurrentSection('geo')}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  </div>

                  {/* Evidence Fusion Showcase Banner */}
                  <EvidenceFusion selectedDetection={selectedDetection} />

                  {/* Map and Anomaly Table Previews */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6 h-[460px]">
                      <DetectionMap
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        telemetry={telemetry}
                      />
                    </div>

                    <div className="lg:col-span-6">
                      <MissionTimeline
                        timelineEvents={timelineEvents}
                        onSelectEventDetection={(id) => {
                          const target = detections.find((d) => d.id === id);
                          if (target) {
                            setSelectedDetection(target);
                            setCurrentSection('sonar');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: LIVE SONAR */}
              {currentSection === 'sonar' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        LIVE SIDE-SCAN SONAR WATERFALL FEED
                      </h2>
                      <p className="text-xs text-slate-400">
                        Dual-channel acoustic swath with dynamic ping sweep and real-time YOLOv8 bounding boxes.
                      </p>
                    </div>
                    <span className="text-xs font-mono-code text-cyan-300 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-800">
                      SWATH: 150m (75m PORT / 75m STBD)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                      <SonarViewer
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        telemetry={telemetry}
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <DetectionPanel
                        detection={selectedDetection}
                        onOpenModal={() => setIsDetailsModalOpen(true)}
                        onViewOnMap={() => setCurrentSection('geo')}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  </div>

                  <EvidenceFusion selectedDetection={selectedDetection} />
                </div>
              )}

              {/* SECTION 3: DETECTION ANALYSIS */}
              {currentSection === 'detection' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                      <DetectionPanel
                        detection={selectedDetection}
                        onOpenModal={() => setIsDetailsModalOpen(true)}
                        onViewOnMap={() => setCurrentSection('geo')}
                        onStatusChange={handleStatusChange}
                      />
                    </div>

                    <div className="lg:col-span-7">
                      <SonarViewer
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        telemetry={telemetry}
                      />
                    </div>
                  </div>

                  <EvidenceFusion selectedDetection={selectedDetection} />
                </div>
              )}

              {/* SECTION 4: EVIDENCE FUSION */}
              {currentSection === 'fusion' && (
                <div className="space-y-6">
                  <EvidenceFusion selectedDetection={selectedDetection} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6">
                      <DetectionPanel
                        detection={selectedDetection}
                        onOpenModal={() => setIsDetailsModalOpen(true)}
                        onViewOnMap={() => setCurrentSection('geo')}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <SonarViewer
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        telemetry={telemetry}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: ANOMALY DATABASE */}
              {currentSection === 'database' && (
                <div className="space-y-6">
                  <AnomalyTable
                    detections={detections}
                    selectedDetection={selectedDetection}
                    onSelectDetection={handleSelectDetection}
                    onOpenDetailsModal={(det) => {
                      setSelectedDetection(det);
                      setIsDetailsModalOpen(true);
                    }}
                    isLoading={isLoadingDetections}
                    onRefresh={fetchDetections}
                    error={detectionsError}
                  />
                </div>
              )}

              {/* SECTION 6: GEO INTELLIGENCE */}
              {currentSection === 'geo' && (
                <div className="space-y-6">
                  <div className="h-[620px] w-full">
                    <DetectionMap
                      detections={detections}
                      selectedDetection={selectedDetection}
                      onSelectDetection={handleSelectDetection}
                      telemetry={telemetry}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6">
                      <DetectionPanel
                        detection={selectedDetection}
                        onOpenModal={() => setIsDetailsModalOpen(true)}
                        onViewOnMap={() => {}}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <AnomalyTable
                        detections={detections}
                        selectedDetection={selectedDetection}
                        onSelectDetection={handleSelectDetection}
                        onOpenDetailsModal={(det) => {
                          setSelectedDetection(det);
                          setIsDetailsModalOpen(true);
                        }}
                        isLoading={isLoadingDetections}
                        onRefresh={fetchDetections}
                        error={detectionsError}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 7: MISSION ANALYTICS */}
              {currentSection === 'analytics' && (
                <div className="space-y-6">
                  <MissionAnalytics
                    summary={dashboardSummary}
                    detections={detections}
                    onRefresh={fetchDashboardSummary}
                    isLoading={isLoadingSummary}
                  />
                </div>
              )}

              {/* SECTION 8: SURVEY MISSIONS */}
              {currentSection === 'missions' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 border-b border-cyan-950/80 pb-3 mb-4">
                      <Ship className="h-5 w-5 text-cyan-400" />
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        SURVEY MISSIONS & TRANSECT SCHEDULE
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-2">
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-bold">
                          ACTIVE MISSION
                        </span>
                        <h3 className="text-base font-bold text-white">MISSION-042 (Sector 07)</h3>
                        <p className="text-xs text-slate-400">
                          Coromandel Continental Shelf debris mapping. 74% completed.
                        </p>
                        <div className="text-xs font-mono-code text-cyan-300 pt-2 border-t border-slate-800">
                          Vessel: RV Ocean Explorer • 4.2 kn
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                          COMPLETED
                        </span>
                        <h3 className="text-base font-bold text-slate-200">MISSION-041 (Sector 06)</h3>
                        <p className="text-xs text-slate-400">
                          Inshore reef inspection. 14 anomalies identified and logged.
                        </p>
                        <div className="text-xs font-mono-code text-slate-500 pt-2 border-t border-slate-800">
                          Finished: 2026-09-12 18:00 UTC
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                          SCHEDULED
                        </span>
                        <h3 className="text-base font-bold text-slate-200">MISSION-043 (Sector 08)</h3>
                        <p className="text-xs text-slate-400">
                          Deep trench acoustic bathymetry. Towfish inspection at 40m depth.
                        </p>
                        <div className="text-xs font-mono-code text-slate-500 pt-2 border-t border-slate-800">
                          Start Window: 2026-09-14 06:00 UTC
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 9: UPLOAD SONAR */}
              {currentSection === 'upload' && (
                <div className="space-y-6">
                  <UploadSonar
                    onNewDetectionAdded={handleNewDetectionAdded}
                    onNavigateToSonar={() => setCurrentSection('sonar')}
                    telemetry={telemetry}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                  />
                </div>
              )}

              {/* SECTION 10: ALERTS */}
              {currentSection === 'alerts' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white tracking-tight border-b border-cyan-950/80 pb-3 mb-4">
                      TACTICAL ALERT LOG
                    </h2>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => handleSelectAlert(alert.detectionId)}
                          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-4 cursor-pointer hover:border-cyan-500 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              className={`h-5 w-5 ${
                                alert.priority === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                              }`}
                            />
                            <div>
                              <div className="text-xs font-bold text-white font-mono-code">
                                {alert.title}
                              </div>
                              <div className="text-xs text-slate-400">{alert.message}</div>
                            </div>
                          </div>
                          <span className="text-xs font-mono-code text-cyan-400">
                            Inspect Contact &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 11: REPORTS */}
              {currentSection === 'reports' && (
                <div className="space-y-6">
                  {/* Reports Overview Banner */}
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950/80 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          HYDROGRAPHIC SURVEY REPORTS & GIS ENGINE
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={fetchReports}
                          disabled={isLoadingReports}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 text-xs font-mono-code hover:border-cyan-500 transition-colors disabled:opacity-50"
                          title="Refresh reports from FastAPI backend"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReports ? 'animate-spin' : ''}`} />
                          <span>SYNC</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              setIsAuthModalOpen(true);
                            } else {
                              setIsCreateReportOpen(!isCreateReportOpen);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                        >
                          <Plus className="h-4 w-4" />
                          <span>CREATE REPORT</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      Generate, manage, and archive automated marine debris assessment reports complying with
                      IHO (International Hydrographic Organization) S-44 standards and national environmental
                      remediation requirements. Directly integrated with the FastAPI SQLite repository.
                    </p>

                    {/* Quick Exports */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            Executive Hydrographic Summary
                          </div>
                          <div className="text-[11px] font-mono-code text-slate-400">
                            Formatted survey briefing with {detections.length} acoustic contacts & telemetry
                          </div>
                        </div>
                        <button
                          onClick={handleExportSummaryPDF}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>EXPORT TXT</span>
                        </button>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            GeoJSON Spatial Dataset
                          </div>
                          <div className="text-[11px] font-mono-code text-slate-400">
                            Georeferenced anomaly coordinates for QGIS and ArcGIS integration
                          </div>
                        </div>
                        <button
                          onClick={handleExportGeoJSON}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500 text-cyan-300 text-xs font-bold hover:bg-cyan-950 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>GEOJSON</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Create Report Panel */}
                  <AnimatePresence>
                    {isCreateReportOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-cyan-800/60 bg-[#0a1628]/95 p-5 backdrop-blur-md overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3 mb-4">
                          <h3 className="text-sm font-bold text-white font-mono-code uppercase text-cyan-300">
                            NEW MISSION ASSESSMENT REPORT
                          </h3>
                          <button
                            onClick={() => setIsCreateReportOpen(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
                          <div>
                            <label className="block font-mono-code text-slate-300 mb-1">
                              REPORT TITLE *
                            </label>
                            <input
                              type="text"
                              required
                              value={newReportTitle}
                              onChange={(e) => setNewReportTitle(e.target.value)}
                              placeholder="e.g., Sector 07 Acoustic Debris Field Survey"
                              className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono-code focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-mono-code text-slate-300 mb-1">
                                LINKED TARGET DETECTION ID (OPTIONAL)
                              </label>
                              <input
                                type="number"
                                value={newReportDetectionId}
                                onChange={(e) => setNewReportDetectionId(e.target.value)}
                                placeholder="e.g. 1"
                                className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono-code focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block font-mono-code text-slate-300 mb-1">
                                REPORT STATUS
                              </label>
                              <div className="w-full rounded bg-slate-900 border border-slate-800 px-3 py-2 text-slate-400 font-mono-code">
                                DRAFT (Initial Assessment)
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono-code text-slate-300 mb-1">
                              ASSESSMENT DESCRIPTION & HYDROGRAPHIC NOTES
                            </label>
                            <textarea
                              rows={3}
                              value={newReportDescription}
                              onChange={(e) => setNewReportDescription(e.target.value)}
                              placeholder="Enter acoustic sonar observations, shadow triangulation remarks, and ROV recommendation notes..."
                              className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono-code focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsCreateReportOpen(false)}
                              className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-900 transition-colors font-mono-code"
                            >
                              CANCEL
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReport}
                              className="flex items-center gap-1.5 px-5 py-2 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 font-mono-code"
                            >
                              {isSubmittingReport && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              <span>SUBMIT REPORT TO DATABASE</span>
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reports List Table */}
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-code font-bold text-cyan-400 uppercase tracking-wider">
                          REGISTERED HYDROGRAPHIC REPORTS
                        </span>
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {reports.length} TOTAL
                        </span>
                      </div>
                      {!currentUser && (
                        <span className="text-[10px] font-mono-code text-amber-400">
                          NOTE: Operator login required to submit new reports
                        </span>
                      )}
                    </div>

                    {isLoadingReports ? (
                      <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-xs font-mono-code">
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                        <span>Querying reports from SQLite backend...</span>
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <FileText className="h-8 w-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-mono-code text-slate-400">
                          No assessment reports found in the backend database.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Click &quot;CREATE REPORT&quot; above to file your first hydrographic survey report.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] font-mono-code text-slate-400 uppercase">
                              <th className="py-2.5 px-3">Report ID</th>
                              <th className="py-2.5 px-3">Title</th>
                              <th className="py-2.5 px-3">Linked Detection</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Created</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono-code text-slate-300">
                            {reports.map((rep) => (
                              <tr key={rep.id} className="hover:bg-cyan-950/20 transition-colors">
                                <td className="py-3 px-3 text-cyan-400 font-bold">
                                  #REP-{String(rep.id).padStart(3, '0')}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-100">{rep.title}</div>
                                  {rep.description && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-md">
                                      {rep.description}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {rep.detection_id ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                      DET #{rep.detection_id}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">General Survey</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                      rep.status.toLowerCase() === 'submitted'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                        : rep.status.toLowerCase() === 'archived'
                                        ? 'bg-slate-900 text-slate-400 border border-slate-700'
                                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                                    }`}
                                  >
                                    {rep.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-[10px] text-slate-400">
                                  {new Date(rep.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => handleDeleteReport(rep.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 12: SYSTEM HEALTH */}
              {currentSection === 'health' && (
                <div className="space-y-6">
                  <MissionHealth />
                </div>
              )}

              {/* SECTION 13: SETTINGS */}
              {currentSection === 'settings' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white tracking-tight border-b border-cyan-950/80 pb-3 mb-4">
                      SYSTEM CONFIGURATION
                    </h2>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      OPEN SETTINGS DIALOG
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Alert Panel Drawer */}
      <AlertPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        onMarkAllRead={handleMarkAllAlertsRead}
      />

      {/* Deep Inspection Modal */}
      <DetectionModal
        detection={selectedDetection}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onViewOnMap={() => {
          setCurrentSection('geo');
          setIsDetailsModalOpen(false);
        }}
      />

      {/* Hydrographic Settings Dialog */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        telemetry={telemetry}
        onUpdateTelemetry={(updates) => setTelemetry((prev) => ({ ...prev, ...updates }))}
      />

      {/* Operator Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user: UserProfile) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          fetchAllBackendData();
        }}
      />
    </div>
  );
}