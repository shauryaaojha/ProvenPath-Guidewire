'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Hash, ExternalLink, X, FileText, CheckCircle2 } from 'lucide-react';

interface ProvenanceDrawerProps {
  clauseId: string | null;
  onClose: () => void;
}

interface ProvenanceData {
  clauseId: string;
  name: string;
  patternCode: string;
  sourceCode: string;
  sourceTitle: string;
  jurisdiction: string;
  section: string;
  textSnippet: string;
  sha256: string;
  effectiveDate: string;
  ruleCodes: string[];
}

export function ProvenanceDrawer({ clauseId, onClose }: ProvenanceDrawerProps) {
  const [data, setData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!clauseId) {
      setData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/v1/provenance/${clauseId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [clauseId]);

  if (!clauseId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl p-6 shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-slate-100">
              LEGAL PROVENANCE AUDIT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Fetching statutory provenance record...
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                CLAUSE IDENTIFIER & NAME
              </span>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {data.name}
              </div>
              <div className="text-[11px] font-mono text-cyan-300">
                {data.patternCode} ({data.clauseId})
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                REGULATORY ACT & JURISDICTION
              </span>
              <div className="text-slate-200 font-medium">{data.sourceTitle}</div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>{data.jurisdiction}</span>
                <span>·</span>
                <span>{data.section}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                BYTE-EXACT REGULATORY CORPUS SNIPPET
              </span>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-serif italic text-slate-300 text-xs leading-relaxed">
                &quot;{data.textSnippet}&quot;
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                CORPUS SHA256 INTEGRITY HASH
              </span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-900/40 text-[10px] font-mono text-emerald-300 break-all select-all">
                {data.sha256}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                VERIFIED BY DETERMINISTIC GOSU RULES
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.ruleCodes?.map(rc => (
                  <span
                    key={rc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-[10px] font-mono text-emerald-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {rc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
