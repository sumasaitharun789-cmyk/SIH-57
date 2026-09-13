'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function Home() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
    return <LandingIntro onEnterDashboard={() => setHasEntered(true)} />;
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

      {/* Main Mission Workspace */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Telemetry Bar */}
        <Topbar
          telemetry={telemetry}
          onToggleAlerts={() => setIsAlertsOpen(true)}
          onToggleSettings={() => setIsSettingsOpen(true)}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          unreadAlertsCount={unreadAlertCount}
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
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 7: MISSION ANALYTICS */}
              {currentSection === 'analytics' && (
                <div className="space-y-6">
                  <MissionAnalytics />
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
                  <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md space-y-4">
                    <div className="flex items-center gap-2 border-b border-cyan-950/80 pb-3">
                      <FileText className="h-5 w-5 text-cyan-400" />
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        HYDROGRAPHIC SURVEY REPORTS & GIS EXPORTS
                      </h2>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      Generate automated marine debris assessment reports complying with IHO (International
                      Hydrographic Organization) S-44 standards and national environmental remediation formats.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            Sector 07 Marine Debris Executive Summary
                          </div>
                          <div className="text-[11px] font-mono-code text-slate-400">
                            Includes 47 detections, shadow height ratios & GPS coordinates
                          </div>
                        </div>
                        <button
                          onClick={() => alert('Exporting PDF Survey Report...')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            GeoJSON / Shapefile Spatial Dataset
                          </div>
                          <div className="text-[11px] font-mono-code text-slate-400">
                            Georeferenced anomaly polygon swath for QGIS and ArcGIS
                          </div>
                        </div>
                        <button
                          onClick={() => alert('Exporting GeoJSON Spatial Layer...')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500 text-cyan-300 text-xs font-bold hover:bg-cyan-950 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>GeoJSON</span>
                        </button>
                      </div>
                    </div>
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
    </div>
  );
}