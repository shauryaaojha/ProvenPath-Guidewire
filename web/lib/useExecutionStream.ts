'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BaseEvent,
  NodeResult,
  GateBlockedPayload,
  PlannerRepairPayload,
  ReviewRequestedPayload,
  PcExportPayload,
  PcStatusPayload,
  ProposalCreatedPayload,
} from './contracts';

export interface ToolCallItem {
  seq: number;
  tool: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
  ts: string;
}

export interface UseExecutionStreamReturn {
  events: BaseEvent[];
  nodesMap: Record<string, NodeResult>;
  nodeStatusSummary: {
    passed: number;
    failed: number;
    skipped: number;
    needsReview: number;
    pending: number;
    total: number;
  };
  overallStatus:
    | 'idle'
    | 'running'
    | 'blocked'
    | 'repairing'
    | 'passed'
    | 'review_pending'
    | 'approved'
    | 'deploying'
    | 'deployed'
    | 'error';
  currentIteration: number;
  blockedData: GateBlockedPayload | null;
  repairData: PlannerRepairPayload | null;
  reviewData: ReviewRequestedPayload | null;
  pcStage: 'idle' | 'export' | 'queued' | 'pulled' | 'write' | 'restart' | 'ready' | 'verified' | 'failed';
  pcDetail: string;
  pcExportData: PcExportPayload | null;
  proposalData: ProposalCreatedPayload | null;
  toolCalls: ToolCallItem[];
  isConnected: boolean;
  isStreaming: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  startStream: (useRealBackend?: boolean, executionId?: string) => void;
  stopStream: () => void;
  resetStream: () => void;
  elapsedRestartSeconds: number;
}

export function useExecutionStream(): UseExecutionStreamReturn {
  const [events, setEvents] = useState<BaseEvent[]>([]);
  const [nodesMap, setNodesMap] = useState<Record<string, NodeResult>>({});
  const [overallStatus, setOverallStatus] = useState<UseExecutionStreamReturn['overallStatus']>('idle');
  const [currentIteration, setCurrentIteration] = useState<number>(1);
  const [blockedData, setBlockedData] = useState<GateBlockedPayload | null>(null);
  const [repairData, setRepairData] = useState<PlannerRepairPayload | null>(null);
  const [reviewData, setReviewData] = useState<ReviewRequestedPayload | null>(null);
  const [pcStage, setPcStage] = useState<UseExecutionStreamReturn['pcStage']>('idle');
  const [pcDetail, setPcDetail] = useState<string>('');
  const [pcExportData, setPcExportData] = useState<PcExportPayload | null>(null);
  const [proposalData, setProposalData] = useState<ProposalCreatedPayload | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(3);
  const [elapsedRestartSeconds, setElapsedRestartSeconds] = useState<number>(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const seenSeqsRef = useRef<Set<number>>(new Set());
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (restartTimerRef.current) {
      clearInterval(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    seenSeqsRef.current.clear();
    setEvents([]);
    setNodesMap({});
    setOverallStatus('idle');
    setCurrentIteration(1);
    setBlockedData(null);
    setRepairData(null);
    setReviewData(null);
    setPcStage('idle');
    setPcDetail('');
    setPcExportData(null);
    setProposalData(null);
    setToolCalls([]);
    setIsConnected(false);
    setIsStreaming(false);
    setElapsedRestartSeconds(0);
  }, []);

  const handleEvent = useCallback((event: BaseEvent) => {
    // Deduplicate by sequence
    if (seenSeqsRef.current.has(event.seq)) {
      return;
    }
    seenSeqsRef.current.add(event.seq);

    setEvents(prev => [...prev, event]);

    switch (event.type) {
      case 'run.started':
        setOverallStatus('running');
        break;

      case 'proposal.created': {
        const payload = event.payload as unknown as ProposalCreatedPayload;
        setProposalData(payload);
        if (payload.iteration) {
          setCurrentIteration(payload.iteration);
        }
        break;
      }

      case 'tool.called': {
        const payload = event.payload as unknown as { tool: string; args: Record<string, unknown> };
        setToolCalls(prev => [
          ...prev,
          {
            seq: event.seq,
            tool: payload.tool,
            args: payload.args,
            ts: event.ts,
          },
        ]);
        break;
      }

      case 'tool.result': {
        const payload = event.payload as unknown as { tool: string; result: Record<string, unknown> };
        setToolCalls(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].tool === payload.tool && !updated[i].result) {
              updated[i] = { ...updated[i], result: payload.result };
              break;
            }
          }
          return updated;
        });
        break;
      }

      case 'verify.node': {
        const node = event.payload as unknown as NodeResult;
        setNodesMap(prev => ({
          ...prev,
          [node.ruleCode]: node,
        }));
        break;
      }

      case 'gate.blocked': {
        const payload = event.payload as unknown as GateBlockedPayload;
        setBlockedData(payload);
        setOverallStatus('blocked');
        break;
      }

      case 'planner.repair': {
        const payload = event.payload as unknown as PlannerRepairPayload;
        setRepairData(payload);
        setOverallStatus('repairing');
        setCurrentIteration(payload.iteration || 2);
        break;
      }

      case 'gate.passed':
        setOverallStatus('passed');
        break;

      case 'review.requested': {
        const payload = event.payload as unknown as ReviewRequestedPayload;
        setReviewData(payload);
        setOverallStatus('review_pending');
        break;
      }

      case 'review.decided': {
        const payload = event.payload as unknown as { decision: string };
        if (payload.decision === 'approved') {
          setOverallStatus('approved');
        }
        break;
      }

      case 'pc.export': {
        const payload = event.payload as unknown as PcExportPayload;
        setPcExportData(payload);
        setPcStage('export');
        setOverallStatus('deploying');
        setPcDetail(`Building overlay for ${payload.productCode} (${payload.files} files)`);
        break;
      }

      case 'pc.queued':
        setPcStage('queued');
        setPcDetail('Package queued for VM agent long-poll');
        break;

      case 'pc.pulled': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('pulled');
        setPcDetail(`Agent [${payload.agent || 'pcagent'}] claimed package`);
        break;
      }

      case 'pc.write': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('write');
        setPcDetail(payload.detail || '5 files written to PolicyCenter modules/configuration');
        break;
      }

      case 'pc.restart': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('restart');
        setPcDetail(payload.detail || 'gwb.bat stopServer / runServer in progress...');
        // Start live elapsed timer
        if (!restartTimerRef.current) {
          restartTimerRef.current = setInterval(() => {
            setElapsedRestartSeconds(prev => prev + 1);
          }, 1000);
        }
        break;
      }

      case 'pc.ready': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('ready');
        setPcDetail(payload.detail || 'PolicyCenter port 8180 accessible');
        if (restartTimerRef.current) {
          clearInterval(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        break;
      }

      case 'pc.verified': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('verified');
        setOverallStatus('deployed');
        setPcDetail(payload.detail || 'ProductModelAPI: SMCyber patterns verified in PolicyCenter');
        break;
      }

      case 'pc.failed': {
        const payload = event.payload as unknown as PcStatusPayload;
        setPcStage('failed');
        setOverallStatus('error');
        setPcDetail(payload.detail || 'PolicyCenter deployment failed');
        if (restartTimerRef.current) {
          clearInterval(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        break;
      }

      case 'run.completed':
        setIsStreaming(false);
        break;

      default:
        break;
    }
  }, []);

  const startStream = useCallback(
    (useRealBackend: boolean = false, executionId: string = 'exec-demo-run') => {
      resetStream();
      setIsStreaming(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const streamUrl = useRealBackend
        ? `${apiUrl}/api/v1/executions/${executionId}/stream`
        : `/api/dev-stream?speed=${speed}&pauseAtBlocked=true`;

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.onmessage = e => {
          try {
            const parsed = JSON.parse(e.data);
            handleEvent(parsed);
          } catch {
            // ignore malformed message
          }
        };

        es.onerror = () => {
          // If real backend fails, we gracefully keep whatever we have
          setIsConnected(false);
          setIsStreaming(false);
          es.close();
        };
      } catch (err) {
        console.error('EventSource connection error:', err);
        setIsConnected(false);
        setIsStreaming(false);
      }
    },
    [resetStream, handleEvent, speed]
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (restartTimerRef.current) {
      clearInterval(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (restartTimerRef.current) {
        clearInterval(restartTimerRef.current);
      }
    };
  }, []);

  // Compute node status summary
  const nodeValues = Object.values(nodesMap);
  const nodeStatusSummary = {
    passed: nodeValues.filter(n => n.result === 'PASSED').length,
    failed: nodeValues.filter(n => n.result === 'FAILED').length,
    skipped: nodeValues.filter(n => n.result === 'SKIPPED').length,
    needsReview: nodeValues.filter(n => n.result === 'NEEDS_REVIEW').length,
    pending: 23 - nodeValues.length,
    total: 23,
  };

  return {
    events,
    nodesMap,
    nodeStatusSummary,
    overallStatus,
    currentIteration,
    blockedData,
    repairData,
    reviewData,
    pcStage,
    pcDetail,
    pcExportData,
    proposalData,
    toolCalls,
    isConnected,
    isStreaming,
    speed,
    setSpeed,
    startStream,
    stopStream,
    resetStream,
    elapsedRestartSeconds,
  };
}
