'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  Presentation,
  Award,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { ReplayTamperControls } from '@/components/controls/ReplayTamperControls';

interface NavbarProps {
  overallStatus: string;
  isStreaming: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  onStartDemo: () => void;
  onReset: () => void;
  onOpenMetrics: () => void;
  onOpenPitchDeck: () => void;
  onOpenDeploy: () => void;
  onTriggerTamper: (data: unknown) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Navbar({
  overallStatus,
  isStreaming,
  speed,
  setSpeed,
  onStartDemo,
  onReset,
  onOpenMetrics,
  onOpenPitchDeck,
  onOpenDeploy,
  onTriggerTamper,
  isDark,
  onToggleTheme,
}: NavbarProps) {
  const getStatusBadge = () => {
    switch (overallStatus) {
      case 'running':
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-medium border animate-pulse ${
              isDark
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-black/5 border-black/20 text-black'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> STREAMING VERDICT
          </span>
        );
      case 'blocked':
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold border ${
              isDark
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                : 'bg-black text-white border-black shadow-[0_0_15px_rgba(0,0,0,0.2)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> GATE 1 BLOCKED · 0 COMMITTED
          </span>
        );
      case 'repairing':
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold border ${
              isDark
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-black/5 border-black/20 text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> ACTUARIAL AUTO-REPAIR
          </span>
        );
      case 'passed':
      case 'review_pending':
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold border ${
              isDark
                ? 'bg-white/15 border-white/40 text-white'
                : 'bg-black/10 border-black/30 text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED COMPLIANT
          </span>
        );
      case 'approved':
      case 'deploying':
        return (
          <button
            onClick={onOpenDeploy}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/15 border-white/40 text-white hover:bg-white/25'
                : 'bg-black/10 border-black/30 text-black hover:bg-black/15'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> DEPLOYING TO PC
          </button>
        );
      case 'deployed':
        return (
          <button
            onClick={onOpenDeploy}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold border transition-colors cursor-pointer shadow-sm ${
              isDark
                ? 'bg-white text-black border-white hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                : 'bg-black text-white border-black hover:bg-neutral-800 shadow-[0_0_20px_rgba(0,0,0,0.25)]'
            }`}
            title="Click to view Guidewire PolicyCenter deployment manifest & files"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> PC DEPLOY VERIFIED
          </button>
        );
      default:
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] border ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-neutral-400'
                : 'bg-black/[0.03] border-black/10 text-neutral-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-neutral-500' : 'bg-neutral-400'
              }`}
            />{' '}
            STANDBY · READY
          </span>
        );
    }
  };

  return (
    <header
      className={`border-b px-4 py-2.5 backdrop-blur-md sticky top-0 z-30 transition-colors ${
        isDark
          ? 'bg-[#050507]/90 border-white/10 text-white'
          : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Product Name (Monochrome) */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
              isDark
                ? 'bg-black border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                : 'bg-black border-black text-white shadow-sm'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono tracking-wider uppercase">
                PROVENPATH
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isDark
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}
              >
                POLICYCENTER 10
              </span>
            </div>
            <p
              className={`text-[10px] font-mono ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Deterministic Pre-Commit Compliance Gate · Track D: Mission Control
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">{getStatusBadge()}</div>

        {/* Action Controls, Modals & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-neutral-300" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-700" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Metrics Trigger (vector charts inside modal preserved) */}
          <button
            onClick={onOpenMetrics}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Metrics
          </button>

          {/* Pitch Deck Trigger (vector charts inside modal preserved) */}
          <button
            onClick={onOpenPitchDeck}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" /> Pitch Deck
          </button>

          <div
            className={`h-5 w-px mx-1 ${
              isDark ? 'bg-neutral-800' : 'bg-neutral-300'
            }`}
          />

          {/* Replay & Tamper Controls (Re-verify & Tamper retain colors) */}
          <ReplayTamperControls
            speed={speed}
            setSpeed={setSpeed}
            onStartDemo={onStartDemo}
            onReset={onReset}
            isStreaming={isStreaming}
            onTriggerTamperBlocked={onTriggerTamper}
            isDark={isDark}
          />
        </div>
      </div>
    </header>
  );
}
