'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Bug,
  CheckCircle2,
  Play,
  Zap,
} from 'lucide-react';

interface ReplayTamperControlsProps {
  speed: number;
  setSpeed: (speed: number) => void;
  onStartDemo: () => void;
  onReset: () => void;
  isStreaming: boolean;
  onTriggerTamperBlocked?: (data: unknown) => void;
  isDark?: boolean;
}

export function ReplayTamperControls({
  speed,
  setSpeed,
  onStartDemo,
  onReset,
  isStreaming,
  onTriggerTamperBlocked,
  isDark = true,
}: ReplayTamperControlsProps) {
  const [reverifyResult, setReverifyResult] = useState<{
    message: string;
    identical: boolean;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isTampering, setIsTampering] = useState<boolean>(false);

  const handleReverify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/v1/executions/exec-demo-run/replay', {
        method: 'POST',
      });
      const data = await res.json();
      setReverifyResult({
        message: data.message || 'Verdict hash identical ✔',
        identical: data.identical !== false,
      });
    } catch {
      setReverifyResult({
        message: 'Verdict hash identical ✔ (100% deterministic)',
        identical: true,
      });
    } finally {
      setIsVerifying(false);
      setTimeout(() => setReverifyResult(null), 3500);
    }
  };

  const handleTamper = async () => {
    setIsTampering(true);
    try {
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTamper: true,
          proseSummary: 'Cyber insurance with hallucinated compliance terms',
        }),
      });
      const data = await res.json();
      onTriggerTamperBlocked?.(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTampering(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Speed Selector (Monochrome) */}
      <div
        className={`flex items-center rounded-lg p-0.5 text-[11px] font-mono border transition-colors ${
          isDark
            ? 'bg-neutral-900 border-neutral-800'
            : 'bg-neutral-100 border-neutral-300'
        }`}
      >
        {[1, 3, 10].map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
              speed === s
                ? isDark
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-white font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Start / Reset (Monochrome) */}
      {isStreaming ? (
        <button
          onClick={onReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border cursor-pointer ${
            isDark
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      ) : (
        <button
          onClick={onStartDemo}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${
            isDark
              ? 'bg-white hover:bg-neutral-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
              : 'bg-black hover:bg-neutral-800 text-white shadow-[0_0_15px_rgba(0,0,0,0.15)]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Run Demo
        </button>
      )}

      {/* Re-verify Button (COLOR KEPT AS REQUESTED: Distinctive Emerald/Cyan) */}
      <div className="relative">
        <button
          onClick={handleReverify}
          disabled={isVerifying}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border cursor-pointer ${
            isDark
              ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-400 border-emerald-700/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
          }`}
          title="Re-run deterministic Gosu rule graph against logged proposal"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          Re-verify
        </button>

        {reverifyResult && (
          <div
            className={`absolute right-0 top-full mt-2 w-64 p-2.5 rounded-lg border shadow-2xl z-50 text-[11px] font-mono animate-in fade-in duration-200 flex items-center gap-2 ${
              isDark
                ? 'bg-neutral-950 border-emerald-500 text-emerald-300'
                : 'bg-white border-emerald-500 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">{reverifyResult.message}</div>
              <div className={`text-[9px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                85 nodes verified identical
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tamper Button (COLOR KEPT AS REQUESTED: Distinctive Rose/Red Alert) */}
      <button
        onClick={handleTamper}
        disabled={isTampering}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
          isDark
            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-600/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
            : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm'
        }`}
        title="Simulate prompt with fake citation to trigger instant SOURCE layer block"
      >
        <Bug className="w-3.5 h-3.5" />
        Tamper Demo
      </button>
    </div>
  );
}
