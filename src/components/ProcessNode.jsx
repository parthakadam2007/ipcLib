import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Terminal, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
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
  if (!process) return null;

  const stateTheme = PROCESS_STATE_COLORS[process.state] || PROCESS_STATE_COLORS[PROCESS_STATES.READY];

  return (
    <motion.div
      animate={{
        scale: isHighlighted ? 1.02 : 1,
        borderColor: isHighlighted ? 'rgba(56, 189, 248, 0.8)' : undefined,
      }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl border p-4 bg-dark-900/95 transition-all shadow-lg backdrop-blur-md ${
        stateTheme.border
      } ${isHighlighted ? 'glow-cyan ring-1 ring-cyan-400/50' : 'hover:border-slate-700'}`}
    >
      {/* Top Header: PID and State Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${stateTheme.bg} border ${stateTheme.border}`}>
            <CustomIcon className={`w-4 h-4 ${stateTheme.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-white tracking-wide">
                {process.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                [PID: {process.pid}]
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">
              {roleLabel}
            </span>
          </div>
        </div>

        <StatusBadge state={process.state} size="xs" />
      </div>

      {/* Current Active Operation */}
      <div className="bg-dark-950/80 rounded-lg p-2.5 border border-slate-800/80 mb-3 font-mono">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="flex items-center gap-1 uppercase tracking-wider font-semibold">
            <Terminal className="w-3 h-3 text-cyan-400" /> Current Syscall / Op
          </span>
          {process.blockedReason && (
            <span className="text-amber-400 flex items-center gap-0.5 text-[9px] font-semibold">
              <AlertCircle className="w-2.5 h-2.5" /> Blocked
            </span>
          )}
        </div>
        <div className="text-xs text-slate-200 truncate font-mono">
          {process.currentOperation || 'Waiting for instruction...'}
        </div>
        {process.blockedReason && (
          <div className="text-[10px] text-amber-300/90 mt-1 italic leading-tight">
            ↳ {process.blockedReason}
          </div>
        )}
      </div>

      {/* Local Process Memory / State Variables */}
      {!compact && process.localVariables && Object.keys(process.localVariables).length > 0 && (
        <div className="bg-dark-850/60 rounded-lg p-2 border border-slate-800 mb-3 text-[11px] font-mono">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Local Process Memory
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {Object.entries(process.localVariables).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 text-[10px]">{key}:</span>
                <span className="text-cyan-300 font-medium truncate max-w-[80px]" title={String(val)}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats footer: Sent / Received */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1 text-slate-300">
          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
          <span>Tx: <strong className="text-emerald-400">{process.messagesSent?.length || 0}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-slate-300">
          <ArrowDownLeft className="w-3 h-3 text-sky-400" />
          <span>Rx: <strong className="text-sky-400">{process.messagesReceived?.length || 0}</strong></span>
        </div>
      </div>

      {extraDetails}
    </motion.div>
  );
};

