'use client';

import React, { useState, useRef } from 'react';
import { GateBlockedPayload } from '@/lib/contracts';
import { ShieldAlert, BookOpen, AlertOctagon, X, Move } from 'lucide-react';

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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Determine initial box coordinates
    const card = e.currentTarget.parentElement;
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
      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.initX + dx));
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
      style={pos ? { left: `${pos.x}px`, top: `${pos.y}px`, bottom: 'auto', right: 'auto' } : undefined}
      className="fixed bottom-6 right-6 max-w-xl w-full bg-neutral-950 border-2 border-neutral-700 text-white rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-5 z-50 animate-in fade-in duration-200"
    >
      {/* Top Draggable Banner */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between bg-neutral-900 border border-neutral-700 px-3.5 py-2 rounded-lg mb-3 cursor-grab active:cursor-grabbing select-none"
        title="Click and drag to move this card"
      >
        <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>BLOCKED — ZERO FILES WRITTEN TO POLICYCENTER</span>
        </div>
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-neutral-500" />
          {onDismiss && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Block Content (Monochrome card with Blue Headings, Red Actual, Green Expected) */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-sky-400 border border-neutral-700 font-mono font-bold">
              {failure.ruleCode}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-sky-400 border border-neutral-700">
              LAYER: {failure.layer}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            Written to PolicyCenter: <strong className="text-emerald-400">0</strong>
          </span>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-sky-400 font-medium">Actual Value:</span>
            <span className="text-rose-400 font-bold">{failure.actual}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sky-400 font-medium">Maximum Allowed:</span>
            <span className="text-emerald-400 font-bold">{failure.expected}</span>
          </div>
          <div className="pt-1.5 text-neutral-300 border-t border-neutral-800 text-[11px] font-sans">
            <strong className="text-sky-400 font-mono">Engine Reason:</strong> {failure.reason}
          </div>
        </div>

        {/* Source citation with Blue Heading */}
        <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-300 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-mono text-[10px] text-sky-400 font-semibold mb-0.5">
              CITED REGULATORY AUTHORITY: {failure.sourceCode}
            </div>
            <p className="italic text-neutral-400 text-[10px]">
              &quot;Coverage for cyber extortion and ransom negotiations shall not exceed 50% of the overall aggregate policy limit.&quot;
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {failure.clauseId && onOpenProvenance && (
            <button
              onClick={() => onOpenProvenance(failure.clauseId!)}
              className="text-[11px] text-sky-400 hover:text-sky-300 underline font-mono flex items-center gap-1 cursor-pointer"
            >
              Inspect Legal Provenance →
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono ml-auto">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Auto-repair loop triggered in planner...
          </div>
        </div>
      </div>
    </div>
  );
}
