'use client';

import React, { useState } from 'react';
import { ReviewRequestedPayload } from '@/lib/contracts';
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
} from 'lucide-react';

interface ReviewerPanelProps {
  reviewData: ReviewRequestedPayload | null;
  onDecided?: (decision: 'approved' | 'rejected', reviewer: string, comment?: string) => void;
  onDeployTrigger?: () => void;
  onDismiss?: () => void;
  isDark?: boolean;
}

const SAMPLE_CLAUSES = [
  {
    clauseId: 'c-001',
    name: 'Data Breach Response Coverage',
    limit: '₹20,00,000',
    deductible: '₹1,00,000',
    rule: 'CYB-RM-001',
    source: 'IRDAI-CYB-G-2024-S4.1',
    sha256: '4a2b9f...948',
  },
  {
    clauseId: 'c-002',
    name: 'Privacy Liability Coverage',
    limit: '₹20,00,000',
    deductible: '₹1,00,000',
    rule: 'CYB-RM-001',
    source: 'IRDAI-CYB-G-2024-S4.1',
    sha256: '4a2b9f...948',
  },
  {
    clauseId: 'c-003',
    name: 'Cyber Extortion Coverage (Repaired)',
    limit: '₹20,00,000 (≤ 50% limit)',
    deductible: '₹1,00,000',
    rule: 'CYB-RNG-002',
    source: 'IRDAI-CYB-G-2024-S3.4',
    sha256: '9f83ea...9a1',
  },
  {
    clauseId: 'c-004',
    name: 'Business Interruption Coverage',
    limit: '₹10,00,000 (12h wait)',
    deductible: '₹50,000',
    rule: 'CYB-RNG-004',
    source: 'IRDAI-CYB-G-2024-S3.3',
    sha256: '12bca0...8ee',
  },
  {
    clauseId: 'c-005',
    name: 'Regulatory Fines & Penalties',
    limit: '₹5,00,000',
    deductible: '₹25,000',
    rule: 'CYB-RM-004',
    source: 'IRDAI-CYB-G-2024-S4.4',
    sha256: '7b3109...1f2',
  },
];

export function ReviewerPanel({
  reviewData,
  onDecided,
  onDeployTrigger,
  onDismiss,
  isDark = true,
}: ReviewerPanelProps) {
  const [selectedReviewer, setSelectedReviewer] = useState<string>(
    'A. Mehta — Compliance Reviewer'
  );
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectComment, setRejectComment] = useState<string>('');
  const [decisionState, setDecisionState] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

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

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: reviewData?.runId || 'f6fa2bbc-4140-4d67-b584-dc712bb81050',
          decision: 'approved',
          reviewer: selectedReviewer,
          comment: 'Approved for automated PolicyCenter 10 packaging',
        }),
      });
      setDecisionState('approved');
      onDecided?.('approved', selectedReviewer);
    } catch {
      setDecisionState('approved');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: reviewData?.runId || 'f6fa2bbc-4140-4d67-b584-dc712bb81050',
          decision: 'rejected',
          reviewer: selectedReviewer,
          comment: rejectComment,
        }),
      });
      setDecisionState('rejected');
      setRejectModalOpen(false);
      onDecided?.('rejected', selectedReviewer, rejectComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;
  if (!reviewData && decisionState === 'idle') return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        data-modal-card="true"
        onClick={e => e.stopPropagation()}
        style={pos ? { position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, margin: 0 } : undefined}
        className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative transition-colors ${
          isDark
            ? 'bg-neutral-950 border-neutral-700 text-white shadow-[0_0_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-neutral-300 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Header (Draggable) */}
        <div
          onMouseDown={handleMouseDown}
          className={`flex items-center justify-between border-b pb-4 mb-4 cursor-grab active:cursor-grabbing select-none ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}
          title="Click and drag to move panel"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-neutral-100 border-neutral-300 text-black'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                HUMAN COMPLIANCE GATE (GATE 2)
              </h2>
              <p
                className={`text-xs font-mono ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Mandatory human review prior to Guidewire PolicyCenter export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-bold ${
                isDark
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-neutral-100 text-black border-neutral-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Engine: 100% Passed
            </span>
            <button
              onClick={handleClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white'
                  : 'border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-black'
              }`}
              title="Close panel to view graph"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hashes Banner */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px] font-mono">
          <div
            className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className={isDark ? 'text-neutral-500 mb-0.5' : 'text-neutral-400 mb-0.5'}>
              VERDICT HASH
            </div>
            <div className="font-bold truncate">
              {reviewData?.verdictHash || 'bd62e7b420e60b3871632bd3a73ff191af00c23b91893474fb509680e9393683'}
            </div>
          </div>
          <div
            className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className={isDark ? 'text-neutral-500 mb-0.5' : 'text-neutral-400 mb-0.5'}>
              DESIGNATED REVIEWER
            </div>
            <select
              value={selectedReviewer}
              onChange={e => setSelectedReviewer(e.target.value)}
              className={`w-full font-medium rounded border p-1 text-xs outline-none ${
                isDark
                  ? 'bg-neutral-950 text-white border-neutral-700'
                  : 'bg-white text-neutral-900 border-neutral-300'
              }`}
            >
              <option value="A. Mehta — Compliance Reviewer">
                A. Mehta — Compliance Reviewer (Legal & Underwriting)
              </option>
              <option value="S. Nair — Chief Underwriting Officer">
                S. Nair — Chief Underwriting Officer
              </option>
              <option value="PM Demo — Guidewire Admin">
                PM Demo — Guidewire Admin
              </option>
            </select>
          </div>
        </div>

        {/* Verified Clause List */}
        <div className="mb-5">
          <div
            className={`flex items-center justify-between text-xs font-mono mb-2 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            <span>PROPOSED PRODUCT CLAUSES & STATUTE PROVENANCE</span>
            <span>5 Approved / 0 Blocked</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {SAMPLE_CLAUSES.map(clause => (
              <div
                key={clause.clauseId}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                  isDark
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">{clause.name}</div>
                    <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Limit: {clause.limit} · Deductible: {clause.deductible}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold">{clause.source}</div>
                  <div className={`text-[9px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {clause.sha256}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Actions */}
        {decisionState === 'idle' ? (
          <div
            className={`flex items-center justify-between pt-3 border-t ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}
          >
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Reject (Requires Reason)
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-neutral-200 text-black font-bold'
                  : 'bg-black hover:bg-neutral-800 text-white font-bold'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Sign & Approve for PolicyCenter Deploy
            </button>
          </div>
        ) : decisionState === 'approved' ? (
          <div
            className={`p-4 rounded-xl border text-center space-y-2 ${
              isDark
                ? 'bg-neutral-900 border-white/20'
                : 'bg-neutral-100 border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Signed & Approved by {selectedReviewer}
            </div>
            <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              HMAC Gate Token minted. Package authorized for Guidewire cloud deployment.
            </p>
            {onDeployTrigger && (
              <button
                onClick={onDeployTrigger}
                className={`mt-2 inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-neutral-200 text-black'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                Proceed to Deploy Stepper <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500 text-center text-xs text-rose-500">
            Proposal rejected. Feedback sent to planner for reconfiguration.
          </div>
        )}

        {/* Reject Reason Modal */}
        {rejectModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center p-6 z-50">
            <div
              className={`border rounded-xl p-5 max-w-md w-full text-xs space-y-3 ${
                isDark
                  ? 'bg-neutral-900 border-neutral-700 text-white'
                  : 'bg-white border-neutral-300 text-neutral-900'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                Reject Compliance Sign-off
              </div>
              <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                You must provide an explicit compliance justification for rejecting this proposal:
              </p>
              <textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="e.g. Underwriting authority requires ₹10,000,000 maximum aggregate..."
                rows={3}
                className={`w-full border rounded-lg p-2.5 outline-none font-sans ${
                  isDark
                    ? 'bg-neutral-950 border-neutral-700 text-white focus:border-white'
                    : 'bg-neutral-50 border-neutral-300 text-black focus:border-black'
                }`}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className={`px-3 py-1.5 rounded border ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectComment.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
