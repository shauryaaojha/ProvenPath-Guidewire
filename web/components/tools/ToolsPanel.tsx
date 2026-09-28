'use client';

import React, { useState } from 'react';
import { ToolCallItem } from '@/lib/useExecutionStream';
import { Wrench, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface ToolsPanelProps {
  toolCalls: ToolCallItem[];
}

export function ToolsPanel({ toolCalls }: ToolsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const copyJson = (data: unknown, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wider font-mono">
            TOOLS INSPECTOR
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {toolCalls.length}
          </span>
        </div>
      </div>

      {/* Tool Call List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-xs">
        {toolCalls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
            <Wrench className="w-8 h-8 text-slate-700 animate-pulse" />
            <div className="text-xs">No tool calls recorded yet</div>
            <div className="text-[10px] text-slate-600">
              Planner tool invocations will appear here
            </div>
          </div>
        ) : (
          toolCalls.map((item, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={`${item.seq}-${item.tool}`}
                className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(idx)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="font-semibold text-sky-300 font-mono text-xs">
                      {item.tool}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                        item.result
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                      }`}
                    >
                      {item.result ? 'COMPLETED' : 'CALLED'}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        copyJson(
                          { tool: item.tool, args: item.args, result: item.result },
                          idx
                        );
                      }}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
                      title="Copy JSON"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-2.5 pt-0 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
                    {item.args && (
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold mb-1">
                          ARGUMENTS
                        </div>
                        <pre className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(item.args, null, 2)}
                        </pre>
                      </div>
                    )}

                    {item.result && (
                      <div>
                        <div className="text-[10px] text-emerald-500/80 font-semibold mb-1">
                          RESULT
                        </div>
                        <pre className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-emerald-300/90 overflow-x-auto">
                          {JSON.stringify(item.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
