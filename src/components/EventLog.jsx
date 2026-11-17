import React, { useState } from 'react';
import { Terminal, Download, Trash2, Filter, CheckCircle2, Clock, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (filterProcess !== 'ALL' && e.process !== filterProcess) return false;
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'waiting':
        return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 shadow-sm backdrop-blur-md flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-dark-850/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Execution History
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-100 text-sky-700 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border dark:border-cyan-500/20">
            {events.length} steps
          </span>
        </div>

        {/* Action buttons: Clear & Export */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white dark:bg-dark-950 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 text-[11px] font-mono shadow-2xs">
            <button
              onClick={() => exportLogToTxt(events, mechanismName)}
              disabled={events.length === 0}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
              title="Download text log (.txt)"
            >
              <Download className="w-3 h-3" /> TXT
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => exportLogToJson(events, mechanismName)}
              disabled={events.length === 0}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-40 transition-colors font-medium"
              title="Download JSON log (.json)"
            >
              JSON
            </button>
          </div>

          <button
            onClick={onClear}
            disabled={events.length === 0}
            className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-dark-950 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-40 shadow-2xs"
            title="Clear Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-dark-950/40 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 font-medium">
          <Filter className="w-3 h-3 text-sky-600 dark:text-cyan-400" /> Filter:
        </div>
        <select
          value={filterProcess}
          onChange={(e) => setFilterProcess(e.target.value)}
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 text-[10px]"
        >
          <option value="ALL">All Sources</option>
          <option value="P1">Process 1 (P1)</option>
          <option value="P2">Process 2 (P2)</option>
          <option value="KERNEL">Kernel / System</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 text-[10px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="success">Success</option>
          <option value="waiting">Waiting / Blocked</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Scrollable Event List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[280px]">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-xs text-center font-sans">
            <Terminal className="w-7 h-7 text-slate-300 dark:text-slate-700 mb-1.5 stroke-[1.5]" />
            <span className="font-medium text-slate-600 dark:text-slate-400">No events logged yet.</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Click "Step Once" or "Auto Run" to see actions recorded live.</span>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isSelected = selectedEventId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => onSelectEvent && onSelectEvent(e)}
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-cyan-500/10 border-sky-400 dark:border-cyan-400 text-slate-900 dark:text-cyan-100 shadow-2xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 dark:bg-dark-950/70 dark:hover:bg-dark-950 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(e.status)}
                    <span className="text-sky-700 dark:text-cyan-400 font-mono font-bold text-[11px]">
                      Step {e.step}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {e.process || 'KERNEL'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {e.operation}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {e.timestamp}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-5 leading-relaxed font-sans">
                  {e.details}
                </div>

                {e.data && (
                  <div className="mt-1 pl-5 text-[10px] text-sky-700 dark:text-cyan-300 font-mono bg-sky-50 dark:bg-cyan-950/30 p-1.5 rounded-md border border-sky-200 dark:border-cyan-900/40 truncate">
                    Data: {typeof e.data === 'object' ? JSON.stringify(e.data) : String(e.data)}
                  </div>
                )}

                {e.stateChange && (
                  <div className="mt-1 pl-5 text-[10px] text-amber-700 dark:text-amber-300 font-medium font-sans">
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
