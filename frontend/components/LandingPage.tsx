'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Radar,
  ArrowRight,
  Compass,
  Cpu,
  Layers,
  Sparkles,
  Database,
  Activity,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Target,
  BarChart3,
  Terminal,
  Server,
  Zap,
  Radio,
  Eye,
  ShieldAlert,
  Sliders,
  ChevronRight,
  UserCheck,
  Check,
  ShieldCheck,
  HelpCircle,
  Clock,
  Filter,
  MonitorCheck,
  MapPin,
  Waves,
  Anchor,
  Ship,
  Trash2,
  EyeOff,
  Boxes,
  FileCheck,
  Maximize2,
  Globe,
} from 'lucide-react';
import { playSonarPing } from '../lib/audioUtils';
import { UserProfile } from '../lib/api';

interface LandingPageProps {
  currentUser: UserProfile | null;
  onEnterMissionControl: () => void;
}

export default function LandingPage({
  currentUser,
  onEnterMissionControl,
}: LandingPageProps) {
  const router = useRouter();

  const handleGetStarted = () => {
    playSonarPing(1000, 0.4);
    if (currentUser) {
      onEnterMissionControl();
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans relative">
      {/* Background Animated Sonar Waves & Grids */}
      <div className="fixed inset-0 sonar-grid opacity-25 pointer-events-none z-0" />

      {/* Ambient Gradient Lighting */}
      <div className="fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none z-0" />

      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-cyan-950/80 bg-[#030712]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: PULSEDEPTH */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-lg border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Radar className="h-5 w-5 text-cyan-400 animate-spin [animation-duration:12s]" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping [animation-duration:3s]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider text-white">
                  PULSE<span className="text-cyan-400">DEPTH</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase tracking-widest bg-cyan-950/90 text-cyan-300 border border-cyan-800/60">
                  DEFENSE S-44
                </span>
              </div>
              <p className="text-[10px] font-mono-code text-slate-400 hidden sm:block">
                ACOUSTIC DEBRIS SURVEILLANCE • RV OCEAN EXPLORER
              </p>
            </div>
          </div>

          {/* Right: SIGN IN & CREATE ACCOUNT (or Authenticated Operator Status) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {currentUser ? (
              <button
                onClick={onEnterMissionControl}
                className="flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 px-3.5 py-2 text-xs font-mono-code font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all active:scale-95 cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span className="max-w-[120px] truncate sm:max-w-none">
                  OPERATOR: {currentUser.username.toUpperCase()}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-200">MISSION CONTROL →</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-950/40 px-3.5 py-2 text-xs font-mono-code font-bold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/50 transition-all active:scale-95"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>SIGN IN</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-3.5 py-2 text-xs font-mono-code font-black text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all active:scale-95"
                >
                  <span>CREATE ACCOUNT</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* HERO SECTION                                       */}
      {/* ================================================== */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Concentric Radar Wave Visual Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-40">
          <div className="h-[400px] w-[400px] sm:h-[650px] sm:w-[650px] rounded-full border border-cyan-500/10 animate-ping [animation-duration:8s]" />
          <div className="absolute h-[280px] w-[280px] sm:h-[450px] sm:w-[450px] rounded-full border border-cyan-500/15" />
          <div className="absolute h-[160px] w-[160px] sm:h-[260px] sm:w-[260px] rounded-full border border-cyan-500/20" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Category Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-6 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI-ASSISTED UNDERWATER MARINE-DEBRIS &amp; SONAR ANALYSIS PLATFORM</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
            PULSE<span className="text-cyan-400">DEPTH</span>
          </h1>

          {/* Tagline */}
          <p className="mt-3 text-base sm:text-lg md:text-xl font-mono-code tracking-[0.25em] text-cyan-300 uppercase font-semibold">
            &ldquo;INTELLIGENCE BENEATH THE SURFACE&rdquo;
          </p>

          {/* Core Description */}
          <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl mx-auto">
            PulseDepth analyzes Side-Scan Sonar imagery to help identify underwater debris and suspicious objects, assess supporting evidence and risk, and associate detections with geographic information.
          </p>

          {/* ONLY ONE PRIMARY BUTTON: GET STARTED → */}
          <div className="mt-10 flex items-center justify-center">
            <button
              onClick={handleGetStarted}
              className="group flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-10 py-4 text-sm sm:text-base font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentUser ? 'ENTER MISSION CONTROL' : 'GET STARTED →'}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ================================================== */}
      {/* SECTION 1: WHY IT MATTERS                          */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-20 border-t border-cyan-950/80 bg-[#020611]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Waves className="h-3.5 w-3.5 text-cyan-400" />
              <span>ENVIRONMENTAL &amp; OPERATIONAL IMPACT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              WHY IT MATTERS
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-cyan-400">
              PROTECTING MARINE ECOSYSTEMS, INFRASTRUCTURE AND UNDERWATER OPERATIONS
            </p>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Marine debris is not simply an environmental issue—it poses acute physical, operational, and financial hazards across global maritime domains.
            </p>
          </div>

          {/* 6 Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    MARINE LIFE
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <Waves className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Plastic, fishing nets, ropes and other debris can entangle or be ingested by marine animals. Abandoned fishing gear can continue trapping marine life even after it has been lost.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    MARINE HABITATS
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <Anchor className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Large debris can damage coral reefs and sensitive seafloor habitats, while plastics can persist and break down into smaller particles.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    UNDERWATER NAVIGATION
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <Ship className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sunken objects, abandoned fishing equipment and other debris can create hazards for boats, ROVs, AUVs and other underwater vehicles.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    MARINE INFRASTRUCTURE
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <Server className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Debris can interfere with or damage pipelines, submarine cables, offshore structures and other underwater infrastructure.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    ECONOMIC IMPACT
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Marine debris can affect fishing, shipping, tourism and other coastal industries and can lead to expensive damage and cleanup.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-6 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black font-mono-code text-white uppercase tracking-wider">
                    POLLUTION
                  </h3>
                  <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Some submerged objects may contain or release pollutants, making early detection and removal important.
                </p>
              </div>
            </div>
          </div>

          {/* Decision Support Mandate Note */}
          <div className="mt-8 max-w-4xl mx-auto rounded-xl border border-cyan-900/50 bg-[#051120]/70 p-4 text-center">
            <p className="text-xs font-mono-code text-slate-300 leading-relaxed">
              <span className="text-cyan-400 font-bold uppercase">ROLE CLARIFICATION:</span> PulseDepth is a <span className="text-white font-semibold">detection, monitoring and decision-support system</span>. It helps identify and prioritize potential debris so that appropriate human and field recovery teams can investigate and remove it.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 2: WHY THIS SYSTEM IS NEEDED               */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-20 border-t border-cyan-950/80 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>SURVEY CHALLENGES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              WHY THIS SYSTEM IS NEEDED
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Extracting actionable intelligence from underwater acoustic data faces critical operational bottlenecks.
            </p>
          </div>

          {/* 6 Operational Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                num: '01',
                title: 'MANUAL INSPECTION',
                desc: 'Large sonar datasets can require significant time and human effort to inspect.',
                icon: Clock,
              },
              {
                num: '02',
                title: 'LOW UNDERWATER VISIBILITY',
                desc: 'Direct visual inspection is difficult in many underwater environments.',
                icon: EyeOff,
              },
              {
                num: '03',
                title: 'COMPLEX SONAR IMAGERY',
                desc: 'Speckle noise, shadows and complex acoustic patterns can make interpretation difficult.',
                icon: Layers,
              },
              {
                num: '04',
                title: 'DEBRIS VS NATURAL SEABED',
                desc: 'Man-made objects can resemble natural seabed structures in sonar imagery.',
                icon: Search,
              },
              {
                num: '05',
                title: 'LOCATION CHALLENGE',
                desc: 'Detecting an object is not enough; operators also need to know where it is located.',
                icon: Compass,
              },
              {
                num: '06',
                title: 'SLOW RESPONSE',
                desc: 'Potentially hazardous objects need to be identified and prioritized quickly for further investigation.',
                icon: AlertTriangle,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-5 backdrop-blur-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono-code font-black text-cyan-400">
                        {item.num}
                      </span>
                      <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Highlighted Statement: THE GOAL */}
          <div className="mt-10 max-w-4xl mx-auto rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/80 via-[#071a33]/90 to-blue-950/80 p-6 text-center shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-cyan-400">
              THE GOAL
            </span>
            <p className="mt-1 text-base sm:text-xl font-black text-white uppercase tracking-tight">
              Reduce the time between sonar acquisition and actionable marine-debris information.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 3: WHAT WE DETECT                          */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-20 border-t border-cyan-950/80 bg-[#020611]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              <span>DETECTION CATEGORIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              WHAT WE DETECT
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-cyan-400">
              IDENTIFYING POTENTIAL MAN-MADE OBJECTS BENEATH THE SURFACE
            </p>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Configured candidate detection classes and acoustic anomaly profiles analyzed by the system pipeline.
            </p>
          </div>

          {/* 6 Target Class Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                num: '01',
                title: 'GHOST NETS',
                desc: 'Abandoned or lost fishing nets that may continue to threaten marine life.',
                icon: Layers,
              },
              {
                num: '02',
                title: 'FISHING GEAR',
                desc: 'Discarded or entangled equipment associated with marine activities.',
                icon: Anchor,
              },
              {
                num: '03',
                title: 'PIPES & CYLINDERS',
                desc: 'Man-made cylindrical structures or objects detected in sonar imagery.',
                icon: Boxes,
              },
              {
                num: '04',
                title: 'SHIPWRECKS',
                desc: 'Large submerged artificial structures and wreckage.',
                icon: Ship,
              },
              {
                num: '05',
                title: 'OTHER DEBRIS',
                desc: 'Potentially hazardous anthropogenic objects requiring further investigation.',
                icon: Trash2,
              },
              {
                num: '06',
                title: 'SUSPICIOUS OBJECTS',
                desc: 'Objects or sonar signatures that require operator review even when their exact classification is uncertain.',
                icon: HelpCircle,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono-code font-black text-cyan-400">
                        {item.num}
                      </span>
                      <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 4: BEYOND DETECTION                        */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-20 border-t border-cyan-950/80 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>CONTEXTUAL INTELLIGENCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              BEYOND DETECTION
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-cyan-400">
              AN OBJECT DETECTED IS ONLY THE BEGINNING
            </p>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              The system does not simply return &ldquo;OBJECT DETECTED&rdquo;. Instead, PulseDepth is designed to provide structured multidimensional information:
            </p>
          </div>

          {/* 6 Structured Dimension Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                dimension: 'WHAT',
                title: 'OBJECT CLASS',
                desc: 'What type of object or candidate was detected.',
                icon: Target,
              },
              {
                dimension: 'CONFIDENCE',
                title: 'MODEL CONFIDENCE',
                desc: 'How confident the detection model is.',
                icon: BarChart3,
              },
              {
                dimension: 'WHERE',
                title: 'GEOLOCATION',
                desc: 'Where the detection is geographically located when coordinates/metadata are available.',
                icon: MapPin,
              },
              {
                dimension: 'EVIDENCE',
                title: 'ACOUSTIC EVIDENCE',
                desc: 'Supporting sonar characteristics such as shape, size, texture and acoustic-shadow information where implemented.',
                icon: Layers,
              },
              {
                dimension: 'RISK',
                title: 'RISK ASSESSMENT',
                desc: 'How the existing risk-assessment logic prioritizes the detection.',
                icon: AlertTriangle,
              },
              {
                dimension: 'ACTION',
                title: 'RECOMMENDED ACTION',
                desc: 'Whether the detection requires further operator attention or investigation.',
                icon: CheckCircle2,
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-mono-code font-black text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40 bg-cyan-950/60">
                        {card.dimension}
                      </span>
                      <Icon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-white mt-1">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 5: HOW IT WORKS (9-STAGE WORKFLOW)         */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-20 border-t border-cyan-950/80 bg-[#020611]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>TECHNICAL PIPELINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              HOW IT WORKS
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-cyan-400">
              FROM SONAR IMAGE TO INTERACTIVE MARINE INTELLIGENCE
            </p>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
              An end-to-end processing pipeline translating raw acoustic waterfall feeds into verified operational records.
            </p>
          </div>

          {/* 9-Stage Visual Pipeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'SIDE-SCAN SONAR',
                desc: 'Sonar survey data is acquired from underwater survey operations.',
                icon: Waves,
              },
              {
                step: '02',
                title: 'SONAR IMAGE',
                desc: 'Side-Scan Sonar imagery and available metadata enter the analysis pipeline.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'PREPROCESSING',
                desc: 'Denoising, normalization, contrast enhancement, and shadow correction.',
                icon: Sliders,
              },
              {
                step: '04',
                title: 'AI / ML DETECTION',
                desc: 'The configured computer-vision model analyzes the processed sonar imagery and identifies potential objects.',
                icon: Cpu,
              },
              {
                step: '05',
                title: 'PARAMETER EXTRACTION',
                desc: 'Evaluate available target parameters including confidence, shape, size, and texture.',
                icon: Maximize2,
              },
              {
                step: '06',
                title: 'ACOUSTIC REASONING',
                desc: 'Use target characteristics and acoustic-shadow information where implemented to support interpretation and filtering.',
                icon: Sparkles,
              },
              {
                step: '07',
                title: 'GEOREFERENCING',
                desc: 'Associate detections with available latitude, longitude, depth, and survey metadata.',
                icon: Compass,
              },
              {
                step: '08',
                title: 'GIS VISUALIZATION',
                desc: 'Display detections on an interactive marine map with bathymetric layers.',
                icon: Globe,
              },
              {
                step: '09',
                title: 'REPORT',
                desc: 'Present detection, coordinates, confidence, risk score, and supporting evidence.',
                icon: FileCheck,
              },
            ].map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-cyan-900/60 bg-[#061224]/80 p-5 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono-code font-black text-cyan-400">
                        {stage.step}
                      </span>
                      <div className="p-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-mono-code font-bold uppercase tracking-wider text-white">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 6: THE RESULT (FINAL INFORMATIONAL)        */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-cyan-950/80 bg-[#030712]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-3">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>THE RESULT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
              FROM RAW DATA TO ACTIONABLE INFORMATION
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              PulseDepth transforms complex sonar observations into structured information that operators can review, map, prioritize and use for further investigation and mission reporting.
            </p>
          </div>

          {/* Sequential Result Flow: SONAR IMAGE -> DETECTION -> CONFIDENCE -> EVIDENCE -> RISK -> LOCATION -> OPERATOR DECISION */}
          <div className="rounded-2xl border border-cyan-900/80 bg-gradient-to-b from-[#06182e] to-[#020a16] p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
              {[
                { title: 'SONAR IMAGE', sub: 'Input Swath', icon: Radar },
                { title: 'DETECTION', sub: 'Candidate Target', icon: Target },
                { title: 'CONFIDENCE', sub: 'Model Score', icon: BarChart3 },
                { title: 'EVIDENCE', sub: 'Shadow Profile', icon: Layers },
                { title: 'RISK', sub: 'Prioritized Hazard', icon: AlertTriangle },
                { title: 'LOCATION', sub: 'RTK Coordinates', icon: MapPin },
                { title: 'OPERATOR DECISION', sub: 'Final Human Sign-off', icon: CheckCircle2 },
              ].map((step, idx) => {
                const Icon = step.icon;
                const isDecision = idx === 6;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
                      isDecision
                        ? 'border-cyan-500/80 bg-cyan-950/70 text-cyan-200'
                        : 'border-cyan-950 bg-[#040e1c]/80 text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 ${isDecision ? 'text-cyan-300' : 'text-cyan-400'}`} />
                    <span className="text-[10px] sm:text-[11px] font-mono-code font-bold uppercase tracking-tight">
                      {step.title}
                    </span>
                    <span className="text-[9px] font-mono-code text-cyan-400/80 mt-1">
                      {step.sub}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-cyan-950/80 flex items-center justify-center gap-2 text-xs font-mono-code text-slate-300 text-center">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Human-in-the-loop architecture: The operator remains responsible for final interpretation and tactical action.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* FOOTER (NO LARGE FINAL GET STARTED CTA SECTION)    */}
      {/* ================================================== */}
      <footer className="border-t border-cyan-950/80 bg-[#020611] py-8 text-center text-xs font-mono-code text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400 font-bold">PULSEDEPTH</span>
            <span>• SIH26057</span>
          </div>
          <div>AI-ASSISTED UNDERWATER MARINE-DEBRIS &amp; SONAR ANALYSIS PLATFORM</div>
          <div>&copy; {new Date().getFullYear()} PULSEDEPTH. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  );
}
