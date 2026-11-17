import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Terminal, ArrowUpRight, ArrowDownLeft, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PROCESS_STATES, PROCESS_STATE_COLORS } from '../engine/processManager';

export const ProcessNode = ({
  process,
  isHighlighted = false,
  roleLabel = 'Worker',
  customIcon: CustomIcon = Cpu,
  extraDetails = null,
  compact = false
}) => {
  const [showMemory, setShowMemory] = useState(false);
  if (!process) return null;

  const stateTheme = PROCESS_STATE_COLORS[process.state] || PROCESS_STATE_COLORS[PROCESS_STATES.READY];
  const hasLocalVars = process.localVariables && Object.keys(process.localVariables).length > 0;

  return (
    <motion.div
      animate={{
        scale: isHighlighted ? 1.02 : 1,
        borderColor: isHighlighted ? 'rgba(2, 132, 199, 0.8)' : undefined,
      }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border p-4 bg-white dark:bg-dark-900/95 transition-all shadow-sm backdrop-blur-md ${
        stateTheme.border
      } ${isHighlighted ? 'ring-2 ring-sky-400/40 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
    >
      {/* Top Header: PID and State Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${stateTheme.bg} border ${stateTheme.border} shadow-2xs`}>
            <CustomIcon className={`w-4 h-4 ${stateTheme.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                {process.name}
              </span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-850 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                PID {process.pid}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              {roleLabel}
            </span>
          </div>
        </div>

        <StatusBadge state={process.state} size="xs" />
      </div>

      {/* Current Active Operation - friendly banner */}
      <div className="bg-slate-50 dark:bg-dark-950/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800/80 mb-3 font-sans">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Current Action
          </span>
          {process.blockedReason && (
            <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3 h-3" /> Blocked
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate font-mono">
          {process.currentOperation || 'Waiting for next instruction...'}
        </div>
        {process.blockedReason && (
          <div className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-1.5 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
            <strong>Reason:</strong> {process.blockedReason}
          </div>
        )}
      </div>

      {/* Collapsible Local Variables / Memory (Keeps UI clean & friendly) */}
      {!compact && hasLocalVars && (
        <div className="mb-3">
          <button
            onClick={() => setShowMemory(!showMemory)}
            className="w-full flex items-center justify-between text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1 transition-colors"
          >
            <span className="flex items-center gap-1">
              <span>Internal Memory Variables ({Object.keys(process.localVariables).length})</span>
            </span>
            {showMemory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMemory && (
            <div className="bg-slate-50 dark:bg-dark-850/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 text-[11px] font-mono mt-1 space-y-1">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {Object.entries(process.localVariables).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">{key}:</span>
                    <span className="text-sky-600 dark:text-cyan-300 font-semibold truncate max-w-[80px]" title={String(val)}>
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats footer: Sent / Received */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800/70 text-[11px] font-sans text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sent: <strong className="text-slate-800 dark:text-white font-mono">{process.messagesSent?.length || 0}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Received: <strong className="text-slate-800 dark:text-white font-mono">{process.messagesReceived?.length || 0}</strong></span>
        </div>
      </div>

      {extraDetails}
    </motion.div>
  );
};
