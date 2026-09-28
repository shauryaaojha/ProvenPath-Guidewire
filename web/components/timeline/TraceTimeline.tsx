'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BaseEvent } from '@/lib/contracts';
import {
  Activity,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Server,
  Wrench,
  Sparkles,
  ArrowDown,
} from 'lucide-react';

interface TraceTimelineProps {
  events: BaseEvent[];
}

export function TraceTimeline({ events }: TraceTimelineProps) {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'planner') return e.type.startsWith('planner.');
    if (filter === 'tools') return e.type.startsWith('tool.');
    if (filter === 'verify') return e.type.startsWith('verify.');
    if (filter === 'gate') return e.type.startsWith('gate.');
    if (filter === 'review') return e.type.startsWith('review.');
    if (filter === 'pc') return e.type.startsWith('pc.');
    return true;
  });

  const getEventBadge = (type: string) => {
    if (type.startsWith('planner.')) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
        badge: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
      };
    }
    if (type.startsWith('tool.')) {
      return {
        icon: <Wrench className="w-3.5 h-3.5 text-sky-400" />,
        badge: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
      };
    }
    if (type === 'gate.blocked') {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
        badge: 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse font-bold',
      };
    }
    if (type === 'gate.passed') {
      return {
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-600 font-bold',
      };
    }
    if (type.startsWith('verify.')) {
      return {
        icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
        badge: 'bg-slate-900 text-emerald-300 border-slate-800',
      };
    }
    if (type.startsWith('review.')) {
      return {
        icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" />,
        badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      };
    }
    if (type.startsWith('pc.')) {
      return {
        icon: <Server className="w-3.5 h-3.5 text-cyan-400" />,
        badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60',
      };
    }
    return {
      icon: <Terminal className="w-3.5 h-3.5 text-slate-400" />,
      badge: 'bg-slate-900 text-slate-300 border-slate-800',
    };
  };

  const formatSummary = (event: BaseEvent) => {
    const payload = event.payload as Record<string, unknown>;

    switch (event.type) {
      case 'run.started':
        return `Started in [${payload.mode || 'fixture'}] mode`;
      case 'planner.step':
        return `Step ${payload.step}: ${payload.action} — ${payload.note || ''}`;
      case 'planner.repair':
        return `Repairing iteration ${payload.iteration}: rule ${payload.failedRule}`;
      case 'tool.called':
        return `Tool called: ${payload.tool}`;
      case 'tool.result':
        return `Tool returned result for ${payload.tool}`;
      case 'proposal.created':
        return `Proposal ${payload.proposalId} created (Iter ${payload.iteration}, ${payload.clauses} clauses)`;
      case 'verify.started':
        return `Verifying 23 rules across ${payload.nodeCount} node instances`;
      case 'verify.node':
        return `${payload.ruleCode} (${payload.layer}): ${payload.result} ${payload.actual ? `[${payload.actual}]` : ''}`;
      case 'gate.blocked': {
        const failed = (payload.failedRules as string[]) || [];
        return `⛔ GATE BLOCKED: Failed ${failed.join(', ')} (0 written to PolicyCenter)`;
      }
      case 'gate.passed':
        return `✅ GATE PASSED: Verdict hash ${String(payload.verdictHash || '').substring(0, 10)}...`;
      case 'review.requested':
        return `Review requested by: ${(payload.reviewers as string[])?.join(', ')}`;
      case 'review.decided':
        return `Review decision: ${payload.decision} by ${payload.reviewer}`;
      case 'pc.export':
        return `Exported ${payload.productCode} package (${payload.files} files)`;
      case 'pc.queued':
        return `Package queued for Guidewire VM agent`;
      case 'pc.pulled':
        return `Agent ${payload.agent || 'pcagent'} pulled package`;
      case 'pc.write':
        return String(payload.detail || 'Files written to configuration');
      case 'pc.restart':
        return String(payload.detail || 'PolicyCenter restarting...');
      case 'pc.ready':
        return String(payload.detail || 'PolicyCenter port 8180 ready');
      case 'pc.verified':
        return `Verified in PolicyCenter: ${String(payload.detail || 'ProductModelAPI check')}`;
      case 'run.completed':
        return `Run completed with status: ${payload.status}`;
      default:
        return JSON.stringify(payload).substring(0, 60);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wider font-mono">
            TRACE TIMELINE
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {events.length}
          </span>
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
            autoScroll
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <ArrowDown className="w-2.5 h-2.5" />
          {autoScroll ? 'Auto-scroll ON' : 'Paused'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1.5 bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto text-[10px] font-mono">
        {[
          { key: 'all', label: 'All' },
          { key: 'planner', label: 'Planner' },
          { key: 'tools', label: 'Tools' },
          { key: 'verify', label: 'Verify' },
          { key: 'gate', label: 'Gates' },
          { key: 'review', label: 'Review' },
          { key: 'pc', label: 'PC' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              filter === item.key
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
            <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
            <div className="text-xs">Waiting for execution stream...</div>
            <div className="text-[10px] text-slate-600">Click &quot;Start Demo Run&quot; above to initiate</div>
          </div>
        ) : (
          filteredEvents.map(event => {
            const badge = getEventBadge(event.type);
            const timeStr = event.ts ? event.ts.substring(11, 23) : '';

            return (
              <div
                key={`${event.seq}-${event.type}`}
                className="group relative flex gap-2 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/90 border border-slate-800/60 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col items-center pt-0.5">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {badge.icon}
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono mt-1">#{event.seq}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold tracking-wider ${badge.badge}`}
                    >
                      {event.type}
                    </span>
                    <span className="text-[9px] text-slate-500">{timeStr}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 break-words leading-tight">
                    {formatSummary(event)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
