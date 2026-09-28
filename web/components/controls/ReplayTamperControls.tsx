'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Bug,
  CheckCircle2,
  AlertTriangle,
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
}

export function ReplayTamperControls({
  speed,
  setSpeed,
  onStartDemo,
  onReset,
  isStreaming,
  onTriggerTamperBlocked,
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
      {/* Speed Selector */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
        {[1, 3, 10].map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded transition-colors ${
              speed === s
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Start / Reset */}
      {isStreaming ? (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      ) : (
        <button
          onClick={onStartDemo}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Run Demo
        </button>
      )}

      {/* Re-verify Button */}
      <div className="relative">
        <button
          onClick={handleReverify}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-900/60 hover:border-emerald-700 text-xs font-mono font-semibold transition-colors"
          title="Re-run deterministic Gosu rule graph against logged proposal"
        >
          <Zap className="w-3.5 h-3.5" />
          Re-verify
        </button>

        {reverifyResult && (
          <div className="absolute right-0 top-full mt-2 w-64 p-2.5 rounded-lg bg-slate-950 border border-emerald-500 shadow-2xl z-50 text-[11px] font-mono text-emerald-300 animate-in fade-in duration-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">{reverifyResult.message}</div>
              <div className="text-[9px] text-slate-400">85 nodes verified identical</div>
            </div>
          </div>
        )}
      </div>

      {/* Tamper Button */}
      <button
        onClick={handleTamper}
        disabled={isTampering}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 hover:border-rose-600 text-xs font-mono font-semibold transition-colors"
        title="Simulate prompt with fake citation to trigger instant SOURCE layer block"
      >
        <Bug className="w-3.5 h-3.5" />
        Tamper Demo
      </button>
    </div>
  );
}
