import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Clock } from 'lucide-react';
import { NodeStatus, Layer } from '@/lib/contracts';

export interface RuleNodeData extends Record<string, unknown> {
  ruleCode: string;
  name: string;
  layer: Layer;
  sourceCode: string;
  status: NodeStatus;
  expected?: string;
  actual?: string;
  reason?: string;
  onClickNode?: (ruleCode: string) => void;
}

export const CustomRuleNode = memo(({ data }: { data: RuleNodeData }) => {
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'PASSED':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-950/60 animate-pulse',
          border: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]',
          badge: 'bg-rose-500/30 text-rose-300 border-rose-500/50',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'SKIPPED':
        return {
          bg: 'bg-slate-900/60',
          border: 'border-slate-700/60 border-dashed',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400" />,
        };
      case 'NEEDS_REVIEW':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'PENDING':
      default:
        return {
          bg: 'bg-slate-900/40',
          border: 'border-slate-800/80 hover:border-slate-600',
          badge: 'bg-slate-800/60 text-slate-500 border-slate-700/60',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  const style = getStatusColor(data.status);

  return (
    <div
      onClick={() => data.onClickNode?.(data.ruleCode)}
      className={`px-3 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer w-[220px] backdrop-blur-sm ${style.bg} ${style.border}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-600 !w-2 !h-2 !border-none"
      />

      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-mono text-xs font-semibold text-slate-200">
          {data.ruleCode}
        </span>
        <span
          className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.badge}`}
        >
          {style.icon}
          {data.status}
        </span>
      </div>

      <div className="text-xs text-slate-300 font-medium truncate mb-1" title={data.name}>
        {data.name}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-mono truncate max-w-[130px]">{data.sourceCode}</span>
        <span className="text-slate-500 uppercase text-[9px] tracking-wider">{data.layer}</span>
      </div>

      {data.status === 'FAILED' && data.actual && (
        <div className="mt-1.5 pt-1.5 border-t border-rose-800/50 text-[10px] text-rose-300 font-mono">
          <div className="truncate">Actual: {data.actual}</div>
          <div className="truncate text-slate-400">Exp: {data.expected}</div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-600 !w-2 !h-2 !border-none"
      />
    </div>
  );
});

CustomRuleNode.displayName = 'CustomRuleNode';
