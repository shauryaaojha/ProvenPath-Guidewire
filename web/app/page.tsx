'use client';

import React, { useState } from 'react';
import { useExecutionStream } from '@/lib/useExecutionStream';
import { useTheme } from '@/lib/useTheme';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RuleDag } from '@/components/dag/RuleDag';
import { TraceTimeline } from '@/components/timeline/TraceTimeline';
import { ToolsPanel } from '@/components/tools/ToolsPanel';
import { BlockedCard } from '@/components/gates/BlockedCard';
import { ReviewerPanel } from '@/components/gates/ReviewerPanel';
import { DeployPanel } from '@/components/deploy/DeployPanel';
import { ProvenanceDrawer } from '@/components/drawers/ProvenanceDrawer';
import { MetricsPanel } from '@/components/metrics/MetricsPanel';
import { PitchDeckModal } from '@/components/deck/PitchDeckModal';
import { GateBlockedPayload } from '@/lib/contracts';

export default function MissionControlPage() {
  const { isDark, toggleTheme } = useTheme();

  const [promptText, setPromptText] = useState<string>(
    'Cyber insurance for Indian startups, up to ₹50L coverage'
  );
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isPitchDeckOpen, setIsPitchDeckOpen] = useState<boolean>(false);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(true);
  const [customBlockedData, setCustomBlockedData] = useState<GateBlockedPayload | null>(null);

  const {
    events,
    nodesMap,
    nodeStatusSummary,
    overallStatus,
    currentIteration,
    blockedData,
    reviewData,
    pcStage,
    pcDetail,
    pcExportData,
    toolCalls,
    isStreaming,
    speed,
    setSpeed,
    startStream,
    resetStream,
    elapsedRestartSeconds,
  } = useExecutionStream();

  const handleStartDemo = () => {
    setIsReviewOpen(true);
    setCustomBlockedData(null);
    startStream(false);
  };

  const handleReset = () => {
    setIsReviewOpen(true);
    setCustomBlockedData(null);
    resetStream();
  };

  const handleTamperBlocked = (data: unknown) => {
    const payload = data as GateBlockedPayload;
    setCustomBlockedData(payload);
  };

  const effectiveBlockedData = customBlockedData || (overallStatus === 'blocked' ? blockedData : null);

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors ${
        isDark ? 'bg-[#050507] text-white' : 'bg-[#f8fafc] text-neutral-900'
      }`}
    >
      {/* Top Command Bar */}
      <Navbar
        overallStatus={overallStatus}
        isStreaming={isStreaming}
        speed={speed}
        setSpeed={setSpeed}
        onStartDemo={handleStartDemo}
        onReset={handleReset}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenPitchDeck={() => setIsPitchDeckOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenReview={() => setIsReviewOpen(true)}
        onTriggerTamper={handleTamperBlocked}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Symmetrical Proposal Prompt Bar (Left edge begins in straight line with Trace Timeline, right edge ends at Tools Inspector) */}
      <div className="px-3 pt-3 shrink-0">
        <div
          className={`flex items-center gap-2 border rounded-xl p-2 transition-colors ${
            isDark
              ? 'bg-neutral-950/80 border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] font-mono font-bold px-2 uppercase tracking-wider shrink-0 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            PROPOSAL PROMPT:
          </span>
          <input
            type="text"
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="Enter insurance product prompt (e.g. Cyber insurance for Indian startups)..."
            className="flex-1 bg-transparent text-xs font-mono outline-none px-1"
          />
          <button
            onClick={() =>
              setPromptText('Cyber insurance for Indian startups, up to ₹50L coverage')
            }
            className={`text-[10px] font-mono px-3 py-1 rounded border whitespace-nowrap cursor-pointer transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300 font-medium'
            }`}
          >
            Preset Demo (₹50L Cyber)
          </button>
        </div>
      </div>

      {/* Main 3-Column Mission Control Grid */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left Column: Trace Timeline (3 cols) */}
        <section className="col-span-3 h-full min-h-0 flex flex-col">
          <TraceTimeline events={events} isDark={isDark} />
        </section>

        {/* Center Column: Interactive 23-Node Rule DAG (6 cols) */}
        <section className="col-span-6 h-full min-h-0 flex flex-col">
          <RuleDag
            nodesMap={nodesMap}
            onSelectClauseId={id => setSelectedClauseId(id)}
            isDark={isDark}
          />
        </section>

        {/* Right Column: Tools Panel & Inspection (3 cols) */}
        <section className="col-span-3 h-full min-h-0 flex flex-col">
          <ToolsPanel toolCalls={toolCalls} isDark={isDark} />
        </section>
      </main>

      {/* Mandatory Disclaimer Footer */}
      <Footer
        currentIteration={currentIteration}
        nodeStats={nodeStatusSummary}
        isDark={isDark}
      />

      {/* Interactive Gated Drawers & Dialogs */}
      {/* 1. Gate Blocked Card */}
      <BlockedCard
        blockedData={effectiveBlockedData}
        onDismiss={() => setCustomBlockedData(null)}
        onOpenProvenance={id => setSelectedClauseId(id)}
      />

      {/* 2. Compliance Reviewer Panel */}
      {overallStatus === 'review_pending' && isReviewOpen && (
        <ReviewerPanel
          reviewData={reviewData}
          onDeployTrigger={() => setIsDeployOpen(true)}
          onDismiss={() => setIsReviewOpen(false)}
          isDark={isDark}
        />
      )}

      {/* 3. PolicyCenter Deploy Drawer */}
      <DeployPanel
        pcStage={pcStage}
        pcDetail={pcDetail}
        pcExportData={pcExportData}
        elapsedRestartSeconds={elapsedRestartSeconds}
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        onTriggerDeploy={() => {
          fetch('/api/v1/deployments', { method: 'POST' });
        }}
      />

      {/* 4. Statutory Provenance Drawer */}
      <ProvenanceDrawer
        clauseId={selectedClauseId}
        onClose={() => setSelectedClauseId(null)}
      />

      {/* 5. Metrics & Assurance Panel (Charts & vector graphics preserved) */}
      <MetricsPanel
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />

      {/* 6. Pitch Deck Modal (Vector slides & diagrams preserved) */}
      <PitchDeckModal
        isOpen={isPitchDeckOpen}
        onClose={() => setIsPitchDeckOpen(false)}
      />
    </div>
  );
}
