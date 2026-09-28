'use client';

import React from 'react';
import { GateBlockedPayload } from '@/lib/contracts';
import { ShieldAlert, BookOpen, AlertOctagon, X } from 'lucide-react';

interface BlockedCardProps {
  blockedData: GateBlockedPayload | null;
  onDismiss?: () => void;
  onOpenProvenance?: (clauseId: string) => void;
}

export function BlockedCard({
  blockedData,
  onDismiss,
  onOpenProvenance,
}: BlockedCardProps) {
  if (!blockedData) return null;

  const failure = blockedData.failures?.[0] || {
    ruleCode: 'CYB-RNG-002',
    layer: 'RANGE',
    expected: '2500000.0 (50% of aggregate limit ₹50L)',
    actual: '4000000 (Extortion sublimit ₹40L)',
    reason: 'Expected LTE 2500000.0 but got 4000000',
    sourceCode: 'IRDAI-CYB-G-2024-S3.4',
    clauseId: 'c-003',
  };

  return (
    <div className="fixed bottom-6 right-6 max-w-xl w-full bg-slate-950 border-2 border-rose-500 rounded-xl shadow-[0_0_50px_rgba(244,63,94,0.4)] p-5 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Top Guarantee Banner */}
      <div className="flex items-center justify-between bg-rose-950/90 border border-rose-600/80 px-3.5 py-2 rounded-lg mb-3 shadow-[inset_0_0_12px_rgba(244,63,94,0.3)]">
        <div className="flex items-center gap-2 text-rose-200 font-mono font-bold text-xs uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>BLOCKED — ZERO FILES WRITTEN TO POLICYCENTER</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Block Content */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700 font-mono font-bold">
              {failure.ruleCode}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
              LAYER: {failure.layer}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Written to PC: <strong className="text-emerald-400">0</strong>
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Actual Value:</span>
            <span className="text-rose-400 font-bold">{failure.actual}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Maximum Allowed:</span>
            <span className="text-emerald-400 font-bold">{failure.expected}</span>
          </div>
          <div className="pt-1 text-slate-300 border-t border-slate-800 text-[11px] font-sans">
            <strong>Engine Reason:</strong> {failure.reason}
          </div>
        </div>

        {/* Source citation */}
        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-mono text-[10px] text-cyan-400 font-semibold mb-0.5">
              CITED REGULATORY AUTHORITY: {failure.sourceCode}
            </div>
            <p className="italic text-slate-400 text-[10px]">
              &quot;Coverage for cyber extortion and ransom negotiations shall not exceed 50% of the overall aggregate policy limit.&quot;
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {failure.clauseId && onOpenProvenance && (
            <button
              onClick={() => onOpenProvenance(failure.clauseId!)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
            >
              Inspect Legal Provenance →
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono ml-auto">
            <ShieldAlert className="w-3.5 h-3.5" />
            Auto-repair loop triggered in planner...
          </div>
        </div>
      </div>
    </div>
  );
}
