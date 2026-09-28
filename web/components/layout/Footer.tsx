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
  isDark?: boolean;
}

export function Footer({ currentIteration, nodeStats, isDark = true }: FooterProps) {
  const pcUrl = process.env.NEXT_PUBLIC_PC_URL || 'http://localhost:8180/pc';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  return (
    <footer
      className={`border-t px-4 py-2 text-[11px] font-mono flex items-center justify-between z-20 transition-colors ${
        isDark
          ? 'bg-[#050507] border-white/10 text-neutral-400'
          : 'bg-white border-neutral-200 text-neutral-600 shadow-sm'
      }`}
    >
      {/* Mandatory Disclaimer (Monochrome) */}
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span className={isDark ? 'text-neutral-300' : 'text-neutral-800'}>
          Rule-graph verdict against a curated constraint set. Not a legal opinion.
        </span>
      </div>

      {/* Live Graph & Iteration Stats */}
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          Iteration: <strong className={isDark ? 'text-white' : 'text-black'}>{currentIteration}</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {nodeStats.passed} Passed
          </span>
          {nodeStats.failed > 0 && (
            <span className="text-rose-500 font-bold">
              · {nodeStats.failed} Blocked
            </span>
          )}
          {nodeStats.skipped > 0 && (
            <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>
              · {nodeStats.skipped} Skipped
            </span>
          )}
          <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>
            / {nodeStats.total} Rules
          </span>
        </span>

        <span
          className={`h-3 w-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'}`}
        />

        <div
          className={`flex items-center gap-3 ${
            isDark ? 'text-neutral-500' : 'text-neutral-400'
          }`}
        >
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Backend: {apiUrl}
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3" /> PolicyCenter: {pcUrl}
          </span>
        </div>
      </div>
    </footer>
  );
}
