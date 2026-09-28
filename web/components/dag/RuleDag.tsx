'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomRuleNode, RuleNodeData } from './CustomRuleNode';
import { RULES_CATALOG, RULE_LAYERS, RULES_MAP } from '@/lib/rules-catalog';
import { NodeResult, NodeStatus, RuleDefinition } from '@/lib/contracts';
import { ShieldCheck, Info, X } from 'lucide-react';

interface RuleDagProps {
  nodesMap: Record<string, NodeResult>;
  onSelectClauseId?: (clauseId: string) => void;
}

const nodeTypes = {
  customRule: CustomRuleNode,
};

export function RuleDag({ nodesMap }: RuleDagProps) {
  const [selectedRule, setSelectedRule] = useState<RuleDefinition | null>(null);

  const handleNodeClick = useCallback((ruleCode: string) => {
    const rule = RULES_MAP[ruleCode];
    if (rule) {
      setSelectedRule(rule);
    }
  }, []);

  // Compute graph nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const layerIndices: Record<string, number> = {
      TYPE: 0,
      RANGE: 1,
      CONSISTENCY: 2,
      RULE_MATCH: 3,
      SOURCE: 4,
      GROUNDING: 5,
    };

    const layerCounters: Record<string, number> = {
      TYPE: 0,
      RANGE: 0,
      CONSISTENCY: 0,
      RULE_MATCH: 0,
      SOURCE: 0,
      GROUNDING: 0,
    };

    const nodes: Node<RuleNodeData>[] = [];
    const edges: Edge[] = [];

    // Group rules by layer
    RULES_CATALOG.forEach(rule => {
      const colIdx = layerIndices[rule.layer] ?? 0;
      const rowIdx = layerCounters[rule.layer]++;

      const x = 40 + colIdx * 260;
      const y = 80 + rowIdx * 115;

      const liveResult = nodesMap[rule.ruleCode];
      const status: NodeStatus = liveResult ? liveResult.result : 'PENDING';

      nodes.push({
        id: rule.ruleCode,
        type: 'customRule',
        position: { x, y },
        data: {
          ruleCode: rule.ruleCode,
          name: rule.name,
          layer: rule.layer,
          sourceCode: rule.sourceCode,
          status,
          expected: liveResult?.expected,
          actual: liveResult?.actual,
          reason: liveResult?.reason,
          onClickNode: handleNodeClick,
        },
      });

      // Construct edges from dependsOn
      rule.dependsOn.forEach(depRuleCode => {
        const isFailed = liveResult?.result === 'FAILED';
        edges.push({
          id: `e-${depRuleCode}-${rule.ruleCode}`,
          source: depRuleCode,
          target: rule.ruleCode,
          animated: status !== 'PENDING' && status !== 'SKIPPED',
          style: {
            stroke: isFailed ? '#f43f5e' : status === 'PASSED' ? '#10b981' : '#475569',
            strokeWidth: isFailed ? 2.5 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isFailed ? '#f43f5e' : status === 'PASSED' ? '#10b981' : '#475569',
            width: 14,
            height: 14,
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [nodesMap, handleNodeClick]);

  const activeResult = selectedRule ? nodesMap[selectedRule.ruleCode] : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Layer Header Strip */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-slate-300 font-semibold tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DETERMINISTIC GOSU VERIFICATION GRAPH (23 RULES)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Passed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Failed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Skipped / Pending
          </span>
        </div>
      </div>

      {/* Layer column names pinned at top */}
      <div className="grid grid-cols-6 gap-2 px-6 py-2 bg-slate-900/40 border-b border-slate-800/60 text-center text-[11px] font-mono font-medium text-slate-400 z-10">
        {RULE_LAYERS.map(l => (
          <div key={l.layer} className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50 truncate">
            <span style={{ color: l.color }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
          <MiniMap
            nodeStrokeColor="#475569"
            nodeColor="#1e293b"
            maskColor="rgba(15, 23, 42, 0.7)"
            className="!bg-slate-900 !border-slate-800"
          />
        </ReactFlow>
      </div>

      {/* Rule Detail Modal */}
      {selectedRule && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {selectedRule.ruleCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedRule.layer}
                </span>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-mono">RULE NAME</label>
                <div className="text-sm font-semibold text-slate-100">{selectedRule.name}</div>
              </div>

              <div>
                <label className="text-slate-500 font-mono">REGULATORY SOURCE CITATION</label>
                <div className="text-slate-300 font-mono bg-slate-950/80 p-2 rounded border border-slate-800">
                  {selectedRule.sourceCode}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-mono">APPLIES TO TARGET</label>
                <div className="text-slate-300 font-mono bg-slate-950/80 p-2 rounded border border-slate-800">
                  {selectedRule.appliesTo}
                </div>
              </div>

              {selectedRule.dependsOn.length > 0 && (
                <div>
                  <label className="text-slate-500 font-mono">DEPENDS ON RULES</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedRule.dependsOn.map(dep => (
                      <span key={dep} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeResult ? (
                <div className="pt-3 border-t border-slate-800">
                  <label className="text-slate-500 font-mono">VERDICT EVALUATION</label>
                  <div className="mt-1 p-2.5 rounded bg-slate-950/90 border border-slate-800 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Result:</span>
                      <span className={activeResult.result === 'PASSED' ? 'text-emerald-400 font-bold' : activeResult.result === 'FAILED' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {activeResult.result}
                      </span>
                    </div>
                    {activeResult.expected && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected:</span>
                        <span className="text-slate-200">{activeResult.expected}</span>
                      </div>
                    )}
                    {activeResult.actual && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Actual:</span>
                        <span className="text-slate-200">{activeResult.actual}</span>
                      </div>
                    )}
                    {activeResult.reason && (
                      <div className="pt-1 text-slate-300 text-[11px] font-sans italic">
                        &quot;{activeResult.reason}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-slate-500 italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Node has not evaluated yet (PENDING in live stream).
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
