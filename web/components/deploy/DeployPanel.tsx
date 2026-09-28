'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Server,
  ExternalLink,
  FileCode,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PcExportPayload, PcManifest } from '@/lib/contracts';

interface DeployPanelProps {
  pcStage: 'idle' | 'export' | 'queued' | 'pulled' | 'write' | 'restart' | 'ready' | 'verified' | 'failed';
  pcDetail: string;
  pcExportData: PcExportPayload | null;
  elapsedRestartSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  onTriggerDeploy?: () => void;
}

const DEPLOY_STEPS = [
  { id: 'export', label: 'Export', desc: 'Package generated' },
  { id: 'queued', label: 'Queued', desc: 'Agent queue ready' },
  { id: 'pulled', label: 'Pulled', desc: 'VM agent claimed' },
  { id: 'write', label: 'Write', desc: 'modules/configuration' },
  { id: 'restart', label: 'Restart', desc: 'gwb.bat reboot' },
  { id: 'ready', label: 'Ready', desc: 'Port 8180 online' },
  { id: 'verified', label: 'Verified', desc: 'ProductModelAPI' },
];

export function DeployPanel({
  pcStage,
  pcDetail,
  pcExportData,
  elapsedRestartSeconds,
  isOpen,
  onClose,
  onTriggerDeploy,
}: DeployPanelProps) {
  const [activeTab, setActiveTab] = useState<'stepper' | 'manifest' | 'files'>('stepper');
  const [copied, setCopied] = useState<boolean>(false);
  const pcUrl = process.env.NEXT_PUBLIC_PC_URL || 'http://localhost:8180/pc';

  // Trigger celebration confetti on pc.verified
  useEffect(() => {
    if (pcStage === 'verified') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    }
  }, [pcStage]);

  if (!isOpen) return null;

  const currentStepIndex = DEPLOY_STEPS.findIndex(s => s.id === pcStage);
  const isCompleted = pcStage === 'verified';

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sampleManifest: PcManifest = {
    productCode: 'SMCyber',
    files: [
      { path: 'modules/configuration/config/resources/productmodel/products/SMCyber/SMCyber.xml', sha256: '9f83ea012bcfe8944510012baac489110432f89104bd194017bb58012da619a1' },
      { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberDataBreachCov.xml', sha256: '4c12009ab58eef71410984da0018593aa716301beaf8263910bb47291738268e' },
      { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberPrivacyLiabilityCov.xml', sha256: '7b310928eac19405627718991204bad895710294821aef719001bca0918451f2' },
      { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberExtortionCov.xml', sha256: '2d54ff89100234a47895018cb1740924ea175b91873024856102be84719014aa' },
      { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberBusinessInterruptionCov.xml', sha256: '6a99471940195e84001bca81924510baf718294628100bb4817290019485123c' },
    ],
    verdictHash: 'bd62e7b420e60b3871632bd3a73ff191af00c23b91893474fb509680e9393683',
    gateToken: 'pp_gt_hmac_8a9f24cb71092e0081d45ff8021c4e7a',
    reviewId: '9addc6e6-67e9-4fa5-98a0-2d83966cfe23',
    reviewer: 'A. Mehta — Compliance Reviewer',
    termRanges: [
      { patternCode: 'SMCyberExtortionCov', termCode: 'Limit', min: 0, max: 2500000, ruleCode: 'CYB-RNG-002' },
      { patternCode: 'SMCyberBusinessInterruptionCov', termCode: 'WaitingPeriod', min: 8, max: 72, ruleCode: 'CYB-RNG-004' },
      { patternCode: 'SMCyberDataBreachCov', termCode: 'Deductible', min: '1%', max: '10%', ruleCode: 'CYB-RNG-003' },
    ],
    generatedAt: new Date().toISOString(),
  };

  const copyManifest = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleManifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-600/60 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                GUIDEWIRE POLICYCENTER DEPLOYMENT PIPELINE
              </h2>
              <p className="text-xs text-slate-400">
                Live automated overlay delivery to PolicyCenter 10 on the Guidewire Cloud VM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
          >
            Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-800 mb-5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('stepper')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'stepper'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Stepper & Status
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'manifest'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            provenpath-manifest.json
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Generated Files ({pcExportData?.files || 5})
          </button>
        </div>

        {/* Stepper View */}
        {activeTab === 'stepper' && (
          <div className="space-y-6">
            {/* Multi-step progress bar */}
            <div className="grid grid-cols-7 gap-2">
              {DEPLOY_STEPS.map((step, idx) => {
                const stepPassed = isCompleted || currentStepIndex > idx;
                const stepCurrent = !isCompleted && currentStepIndex === idx;

                return (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all mb-1.5 ${
                        stepPassed
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : stepCurrent
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {stepPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div
                      className={`text-[11px] font-mono font-medium ${
                        stepPassed
                          ? 'text-emerald-300'
                          : stepCurrent
                          ? 'text-cyan-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate max-w-full">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Activity Box */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">VM AGENT STATUS</span>
                {pcStage === 'restart' && (
                  <span className="flex items-center gap-1.5 text-cyan-400 animate-pulse font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    Restart stopwatch: {formatElapsed(elapsedRestartSeconds)}
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Deployment Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {pcDetail || 'Awaiting deployment trigger...'}
              </p>
            </div>

            {/* Actions Banner */}
            <div className="flex items-center justify-between pt-2">
              {pcStage === 'idle' && onTriggerDeploy && (
                <button
                  onClick={onTriggerDeploy}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg"
                >
                  Deploy to PolicyCenter
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                <a
                  href={pcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  Open in PolicyCenter
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Manifest Viewer */}
        {activeTab === 'manifest' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                HMAC Signed Manifest with Verified Runtime Boundaries
              </span>
              <button
                onClick={copyManifest}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Manifest'}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-72 overflow-y-auto">
              {JSON.stringify(sampleManifest, null, 2)}
            </pre>
          </div>
        )}

        {/* Files View */}
        {activeTab === 'files' && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sampleManifest.files.map(file => (
              <div
                key={file.path}
                className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 font-mono text-xs space-y-1"
              >
                <div className="flex items-center gap-2 text-slate-200 font-semibold truncate">
                  <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  SHA256: {file.sha256}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
