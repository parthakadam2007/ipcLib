import React, { useState } from 'react';
import { Terminal, Download, Trash2, Filter, ChevronRight, CheckCircle2, Clock, AlertTriangle, Info } from 'lucide-react';
import { exportLogToJson, exportLogToTxt } from '../utils/export';

export const EventLog = ({
  events = [],
  onClear,
  mechanismName = 'ipc',
  onSelectEvent = null,
  selectedEventId = null
}) => {
  const [filterProcess, setFilterProcess] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredEvents = events.filter((e) => {
    if (filterProcess !== 'ALL' && e.process !== filterProcess) return false;
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'waiting':
        return <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md flex flex-col h-full overflow-hidden text-slate-200">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-dark-850/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
            Live Execution Log & Timeline
          </h3>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {events.length} events
          </span>
        </div>

        {/* Action buttons: Clear & Export */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-dark-950 rounded-lg border border-slate-800 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => exportLogToTxt(events, mechanismName)}
              disabled={events.length === 0}
              className="px-2 py-0.5 hover:text-white text-slate-400 disabled:opacity-40 transition-colors flex items-center gap-1"
              title="Export as Text (.txt)"
            >
              <Download className="w-3 h-3" /> TXT
            </button>
            <span className="text-slate-400">|</span>
            <button
              onClick={() => exportLogToJson(events, mechanismName)}
              disabled={events.length === 0}
              className="px-2 py-0.5 hover:text-white text-slate-400 disabled:opacity-40 transition-colors"
              title="Export as JSON (.json)"
            >
              JSON
            </button>
          </div>

          <button
            onClick={onClear}
            disabled={events.length === 0}
            className="p-1.5 rounded-lg bg-dark-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors disabled:opacity-40"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-800/80 bg-dark-950/40 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-cyan-400" /> Filter:
        </div>
        <select
          value={filterProcess}
          onChange={(e) => setFilterProcess(e.target.value)}
          className="bg-dark-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Sources</option>
          <option value="P1">Process 1 (P1)</option>
          <option value="P2">Process 2 (P2)</option>
          <option value="KERNEL">Kernel / System</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-dark-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="success">Success</option>
          <option value="waiting">Waiting / Blocked</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Scrollable Event List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[280px]">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 font-mono text-xs">
            <Terminal className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
            <span>No simulation events recorded yet.</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Click 'Run' or 'Step' to begin execution.</span>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isSelected = selectedEventId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => onSelectEvent && onSelectEvent(e)}
                className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-100 shadow-sm'
                    : 'bg-dark-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(e.status)}
                    <span className="text-cyan-400 font-bold text-[11px]">
                      Step {e.step}
                    </span>
                    <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {e.process || 'KERNEL'}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {e.operation}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {e.timestamp}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 pl-5">
                  {e.details}
                </div>

                {e.data && (
                  <div className="mt-1 pl-5 text-[10px] text-cyan-300 bg-cyan-950/30 p-1 rounded border border-cyan-900/40 truncate">
                    Payload: {typeof e.data === 'object' ? JSON.stringify(e.data) : String(e.data)}
                  </div>
                )}

                {e.stateChange && (
                  <div className="mt-1 pl-5 text-[10px] text-amber-300">
                    ↳ State: {e.stateChange.from} → <strong>{e.stateChange.to}</strong>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
