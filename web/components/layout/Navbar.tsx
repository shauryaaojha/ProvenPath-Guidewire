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
} from 'lucide-react';
import { ReplayTamperControls } from '@/components/controls/ReplayTamperControls';

interface NavbarProps {
  promptText: string;
  setPromptText: (text: string) => void;
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
}

export function Navbar({
  promptText,
  setPromptText,
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
}: NavbarProps) {
  const getStatusBadge = () => {
    switch (overallStatus) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 font-mono text-[11px] animate-pulse">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> STREAMING VERDICT
          </span>
        );
      case 'blocked':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-mono text-[11px] font-bold animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> GATE 1 BLOCKED
          </span>
        );
      case 'repairing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-300 font-mono text-[11px] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AUTO-REPAIRING
          </span>
        );
      case 'passed':
      case 'review_pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED PASSED
          </span>
        );
      case 'approved':
      case 'deploying':
        return (
          <button
            onClick={onOpenDeploy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-900 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" /> DEPLOYING TO PC
          </button>
        );
      case 'deployed':
        return (
          <button
            onClick={onOpenDeploy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 font-mono text-[11px] font-bold shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:bg-emerald-900 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PC DEPLOY VERIFIED
          </button>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-600" /> STANDBY
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-30 flex flex-col gap-2.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Product Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono tracking-wider">
                PROVENPATH
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                POLICYCENTER 10
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Deterministic Pre-Commit Compliance Gate · Track D: Mission Control
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>

        {/* Action Controls & Modal Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" /> Metrics
          </button>

          <button
            onClick={onOpenPitchDeck}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <Presentation className="w-3.5 h-3.5 text-cyan-400" /> Pitch Deck
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <ReplayTamperControls
            speed={speed}
            setSpeed={setSpeed}
            onStartDemo={onStartDemo}
            onReset={onReset}
            isStreaming={isStreaming}
            onTriggerTamperBlocked={onTriggerTamper}
          />
        </div>
      </div>

      {/* Request Prompt Bar */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5">
        <span className="text-[10px] font-mono font-semibold text-slate-400 px-2 uppercase tracking-wider shrink-0">
          PROPOSAL PROMPT:
        </span>
        <input
          type="text"
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          placeholder="Enter insurance product prompt..."
          className="flex-1 bg-transparent text-xs text-slate-200 font-mono outline-none px-1"
        />
        <button
          onClick={() =>
            setPromptText('Cyber insurance for Indian startups, up to ₹50L coverage')
          }
          className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700 whitespace-nowrap"
        >
          Preset Demo (₹50L Cyber)
        </button>
      </div>
    </header>
  );
}
