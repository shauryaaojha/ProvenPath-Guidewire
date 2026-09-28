'use client';

import React, { useState } from 'react';
import { useExecutionStream } from '@/lib/useExecutionStream';
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
  const [promptText, setPromptText] = useState<string>(
    'Cyber insurance for Indian startups, up to ₹50L coverage'
  );
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isPitchDeckOpen, setIsPitchDeckOpen] = useState<boolean>(false);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
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
    setCustomBlockedData(null);
    startStream(false);
  };

  const handleTamperBlocked = (data: unknown) => {
    const payload = data as GateBlockedPayload;
    setCustomBlockedData(payload);
  };

  const effectiveBlockedData = customBlockedData || (overallStatus === 'blocked' ? blockedData : null);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Command Bar */}
      <Navbar
        promptText={promptText}
        setPromptText={setPromptText}
        overallStatus={overallStatus}
        isStreaming={isStreaming}
        speed={speed}
        setSpeed={setSpeed}
        onStartDemo={handleStartDemo}
        onReset={resetStream}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenPitchDeck={() => setIsPitchDeckOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onTriggerTamper={handleTamperBlocked}
      />

      {/* Main 3-Column Mission Control Grid */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left Column: Trace Timeline (3 cols) */}
        <section className="col-span-3 h-full min-h-0 flex flex-col">
          <TraceTimeline events={events} />
        </section>

        {/* Center Column: Interactive 23-Node Rule DAG (6 cols) */}
        <section className="col-span-6 h-full min-h-0 flex flex-col">
          <RuleDag
            nodesMap={nodesMap}
            onSelectClauseId={id => setSelectedClauseId(id)}
          />
        </section>

        {/* Right Column: Tools Panel & Inspection (3 cols) */}
        <section className="col-span-3 h-full min-h-0 flex flex-col">
          <ToolsPanel toolCalls={toolCalls} />
        </section>
      </main>

      {/* Mandatory Disclaimer Footer */}
      <Footer
        currentIteration={currentIteration}
        nodeStats={nodeStatusSummary}
      />

      {/* Interactive Gated Drawers & Dialogs */}
      {/* 1. Gate Blocked Card */}
      <BlockedCard
        blockedData={effectiveBlockedData}
        onDismiss={() => setCustomBlockedData(null)}
        onOpenProvenance={id => setSelectedClauseId(id)}
      />

      {/* 2. Compliance Reviewer Panel */}
      {overallStatus === 'review_pending' && (
        <ReviewerPanel
          reviewData={reviewData}
          onDeployTrigger={() => setIsDeployOpen(true)}
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

      {/* 5. Metrics & Assurance Panel */}
      <MetricsPanel
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />

      {/* 6. Pitch Deck Modal */}
      <PitchDeckModal
        isOpen={isPitchDeckOpen}
        onClose={() => setIsPitchDeckOpen(false)}
      />
    </div>
  );
}
