import React from 'react';
import { X, HelpCircle, Activity, Cpu, ArrowRight, ShieldCheck, Database, Server } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PROCESS_STATES } from '../engine/processManager';

export const LegendModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">IPC Visual Simulator Legend</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Process States */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Process States & Lifecycles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.READY} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Ready</span>
                  Process is loaded in RAM, eligible to execute, awaiting CPU allocation.
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.RUNNING} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Running</span>
                  Currently executing instructions on CPU / performing IPC operation.
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.BLOCKED} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Blocked</span>
                  Unable to proceed (waiting for full pipe to drain, empty queue, mutex, or peer open).
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.WAITING} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Waiting</span>
                  Waiting for response packet, acknowledgement, or timer event.
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.TERMINATED} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Terminated</span>
                  Process has exited or received unhandled fatal signal (SIGKILL, SIGTERM).
                </div>
              </div>
            </div>
          </div>

          {/* Communication Channels */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Communication Channels & Flow
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="font-mono text-cyan-300">Animated Pulses / Packets</span>
                </div>
                <span className="text-slate-400">Represents data in flight moving across kernel buffer or network</span>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-[10px]">1</span>
                    <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></span>
                  </div>
                  <span className="font-mono text-slate-300">Buffer Slots (Occupied vs Free)</span>
                </div>
                <span className="text-slate-400">Ring buffer or queue capacity; full buffer halts writers</span>
              </div>
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] border border-amber-500/30">LOCK</span>
                  <span className="font-mono text-amber-300">Mutex / Semaphore Lock</span>
                </div>
                <span className="text-slate-400">Guarantees mutual exclusion for critical sections in shared memory</span>
              </div>
            </div>
          </div>

          {/* Conceptual Disclaimer */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs leading-relaxed">
            <span className="font-semibold block mb-1">Conceptual Educational Simulator Notice</span>
            This interactive simulator runs entirely in your modern browser engine. It models and visualizes authentic POSIX and OS operating system semantics (system calls, kernel buffers, process states, and race conditions) for computer science pedagogy. It does not spawn native operating system processes.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
          >
            Got it, return to lab
          </button>
        </div>
      </div>
    </div>
  );
};

