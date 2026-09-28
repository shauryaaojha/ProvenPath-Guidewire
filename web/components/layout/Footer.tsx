'use client';

import React from 'react';
import { Shield, GitBranch, Cpu, Server } from 'lucide-react';

interface FooterProps {
  currentIteration: number;
  nodeStats: {
    passed: number;
    failed: number;
    skipped: number;
    needsReview: number;
    total: number;
  };
}

export function Footer({ currentIteration, nodeStats }: FooterProps) {
  const pcUrl = process.env.NEXT_PUBLIC_PC_URL || 'http://localhost:8180/pc';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 text-[11px] font-mono text-slate-400 flex items-center justify-between z-20">
      {/* Mandatory Disclaimer */}
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
        <span className="text-slate-300 font-medium">
          Rule-graph verdict against a curated constraint set. Not a legal opinion.
        </span>
      </div>

      {/* Live Graph & Iteration Stats */}
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3 text-cyan-400" />
          Iteration: <strong className="text-slate-200">{currentIteration}</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">{nodeStats.passed} Passed</span>
          {nodeStats.failed > 0 && (
            <span className="text-rose-400 font-bold animate-pulse">
              · {nodeStats.failed} Blocked
            </span>
          )}
          {nodeStats.skipped > 0 && (
            <span className="text-slate-500">· {nodeStats.skipped} Skipped</span>
          )}
          <span className="text-slate-500">/ {nodeStats.total} Rules</span>
        </span>

        <span className="h-3 w-px bg-slate-800" />

        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" /> Backend: {apiUrl}
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" /> PolicyCenter: {pcUrl}
          </span>
        </div>
      </div>
    </footer>
  );
}
