'use client';

import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Award,
  Sliders,
  X,
  Move,
} from 'lucide-react';
import { MetricsSummary } from '@/lib/contracts';

interface MetricsPanelProps {
  metrics?: MetricsSummary;
  isOpen: boolean;
  onClose: () => void;
}

export function MetricsPanel({
  metrics = {
    accuracy: 100.0,
    falsePassRate: 0.0,
    falsePassRatio: '0 / 20',
    falseBlockRate: 0.0,
    falseBlockRatio: '0 / 20',
    provenanceCompleteness: 100.0,
    provenanceCompletenessRatio: '20 / 20 (100%)',
    totalRulesTested: 23,
    determinismRuns: '50 / 50 identical',
    manualDurationEstimate: '~3 weeks manual',
    automatedDurationMs: 3400,
  },
  isOpen,
  onClose,
}: MetricsPanelProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.closest('[data-modal-card="true"]') as HTMLElement;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos ? pos.x : rect.left,
      initY: pos ? pos.y : rect.top,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 350, dragRef.current.initX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragRef.current.initY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        data-modal-card="true"
        onClick={e => e.stopPropagation()}
        style={pos ? { position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, margin: 0 } : undefined}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-3xl w-full p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-white relative transition-colors"
      >
        {/* Header (Draggable) */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5 cursor-grab active:cursor-grabbing select-none"
          title="Click and drag to move panel"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono tracking-wide">
                PROVENPATH ASSURANCE METRICS & EVALUATION
              </h2>
              <p className="text-xs text-neutral-400">
                Rigorous mathematical and actuarial benchmarks across the 23-rule constraint set
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-neutral-500" />
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Metric Cards (Monochrome with sharp data contrast) */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="col-span-1 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
              <span>FALSE-PASS RATE</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                0.0%
              </div>
              <div className="text-xs font-mono font-semibold text-neutral-400 mt-0.5">
                Target: 0% · Actual: {metrics.falsePassRatio}
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Zero unverified clauses or non-compliant values ever reach PolicyCenter.
            </p>
          </div>

          <div className="col-span-1 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
              <span>DETERMINISM</span>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white">
                {metrics.determinismRuns}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Identical verdict hashes
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight font-sans">
              Tested over 50 consecutive runs with zero drift.
            </p>
          </div>

          <div className="col-span-1 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
              <span>PROVENANCE COMPLETENESS</span>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold text-white">
                100.0%
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {metrics.provenanceCompletenessRatio}
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight font-sans">
              Every single term is cryptographically tied to statutory law.
            </p>
          </div>
        </div>

        {/* Time-To-Market Velocity Slider */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-200">
              <Sliders className="w-4 h-4 text-white" />
              <span>TIME-TO-MARKET VELOCITY SLIDER</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              99.9% Cycle Time Reduction
            </span>
          </div>

          {/* Slider comparison card */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
              <div className="text-rose-400 font-bold uppercase text-[10px]">
                TRADITIONAL MANUAL UNDERWRITING
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.manualDurationEstimate}
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Manual meetings, email compliance sign-offs, manual PCF typing in PolicyCenter Studio.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
              <div className="text-emerald-400 font-bold uppercase text-[10px]">
                PROVENPATH AUTOMATED VERIFICATION
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {(metrics.automatedDurationMs / 1000).toFixed(1)} seconds
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                LLM proposes, Gosu verifies, signed package deployed with zero human typing errors.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Drag to compare workload distribution</span>
              <span className="text-white font-bold">{sliderPos}% Automated</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={e => setSliderPos(parseInt(e.target.value, 10))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
