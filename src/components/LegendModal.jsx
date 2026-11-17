import React from 'react';
import { X, HelpCircle, Activity, Cpu, ArrowRight, ShieldCheck, Database, Server, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PROCESS_STATES } from '../engine/processManager';

export const LegendModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-800 dark:text-slate-200 transition-colors">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-cyan-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Guide</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Process States */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Process States & Lifecycles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.READY} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">Ready</span>
                  Process is loaded in memory and waiting for its turn on the CPU.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.RUNNING} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">Running</span>
                  Active on CPU; performing read, write, or IPC system call.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.BLOCKED} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">Blocked</span>
                  Waiting on an event (e.g. pipe is full, queue is empty, lock held).
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.WAITING} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">Waiting</span>
                  Awaiting reply packet, response acknowledgment, or timer.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <StatusBadge state={PROCESS_STATES.TERMINATED} />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">Terminated</span>
                  Finished execution or stopped by unhandled fatal signal (SIGKILL).
                </div>
              </div>
            </div>
          </div>

          {/* Communication Channels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Channel Elements & Flow
            </h4>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping"></span>
                  <span className="font-semibold text-slate-800 dark:text-cyan-300">Animated Pulses & Packets</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-right">Data traveling between processes through the kernel buffer</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded bg-sky-100 border border-sky-300 dark:bg-cyan-500/30 dark:border-cyan-400/50 flex items-center justify-center text-[10px] font-bold text-sky-700">1</span>
                    <span className="w-4 h-4 rounded bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:border-slate-700"></span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-300">Buffer Slots (Occupied vs Empty)</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-right">Shows capacity usage; full buffer pauses writers</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-300">LOCK</span>
                  <span className="font-semibold text-slate-800 dark:text-amber-300">Mutex / Lock Guard</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-right">Ensures only one process can enter the critical section at a time</span>
              </div>
            </div>
          </div>

          {/* Friendly Note */}
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-800/40 text-sky-900 dark:text-cyan-200 text-xs leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Safe Educational Simulator
            </span>
            Everything runs in your browser using interactive JavaScript models. You can test race conditions, deadlocks, and buffer overflows safely with zero risk to your computer.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm"
          >
            Got it, back to lab
          </button>
        </div>
      </div>
    </div>
  );
};
