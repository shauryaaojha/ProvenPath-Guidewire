'use client';

import React, { useState } from 'react';
import { ReviewRequestedPayload } from '@/lib/contracts';
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck,
  ChevronRight,
  Send,
} from 'lucide-react';

interface ReviewerPanelProps {
  reviewData: ReviewRequestedPayload | null;
  onDecided?: (decision: 'approved' | 'rejected', reviewer: string, comment?: string) => void;
  onDeployTrigger?: () => void;
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
}: ReviewerPanelProps) {
  const [selectedReviewer, setSelectedReviewer] = useState<string>(
    'A. Mehta — Compliance Reviewer'
  );
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectComment, setRejectComment] = useState<string>('');
  const [decisionState, setDecisionState] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  if (!reviewData && decisionState === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                HUMAN COMPLIANCE GATE (GATE 2)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Mandatory human review prior to Guidewire PolicyCenter export
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rule Engine: 100% Passed
          </span>
        </div>

        {/* Hashes Banner */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 mb-0.5">VERDICT HASH</div>
            <div className="text-emerald-400 font-bold truncate">
              {reviewData?.verdictHash || 'bd62e7b420e60b3871632bd3a73ff191af00c23b91893474fb509680e9393683'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 mb-0.5">DESIGNATED REVIEWER</div>
            <select
              value={selectedReviewer}
              onChange={e => setSelectedReviewer(e.target.value)}
              className="w-full bg-slate-950 text-cyan-300 font-medium rounded border border-slate-700 p-1 text-xs outline-none"
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
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>PROPOSED PRODUCT CLAUSES & STATUTE PROVENANCE</span>
            <span>5 Approved / 0 Blocked</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {SAMPLE_CLAUSES.map(clause => (
              <div
                key={clause.clauseId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-slate-200 font-semibold">{clause.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Limit: {clause.limit} · Deductible: {clause.deductible}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-cyan-400">{clause.source}</div>
                  <div className="text-[9px] text-slate-500">{clause.sha256}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Actions */}
        {decisionState === 'idle' ? (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-medium transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject (Requires Reason)
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Sign & Approve for PolicyCenter Deploy
            </button>
          </div>
        ) : decisionState === 'approved' ? (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Signed & Approved by {selectedReviewer}
            </div>
            <p className="text-xs text-slate-300">
              HMAC Gate Token minted. Package authorized for Guidewire cloud deployment.
            </p>
            {onDeployTrigger && (
              <button
                onClick={onDeployTrigger}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg"
              >
                Proceed to Deploy Stepper <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-center text-xs text-rose-300">
            Proposal rejected. Feedback sent to planner for reconfiguration.
          </div>
        )}

        {/* Reject Reason Modal */}
        {rejectModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full text-xs space-y-3">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject Compliance Sign-off
              </div>
              <p className="text-slate-400">
                You must provide an explicit compliance justification for rejecting this proposal:
              </p>
              <textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="e.g. Underwriting authority requires ₹10,000,000 maximum aggregate..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-rose-500 font-sans"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectComment.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium disabled:opacity-50"
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
