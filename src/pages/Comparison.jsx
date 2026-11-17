import React, { useState } from 'react';
import { GitCompare, Layers, Cpu, Check, X, Info, HardDrive, MessageSquare, ArrowRight } from 'lucide-react';
import { IPC_COMPARISONS, IPC_MODELS_SUMMARY } from '../data/comparisonData';

export const Comparison = ({ onSelectMechanism }) => {
  const [selectedMechanism, setSelectedMechanism] = useState(IPC_COMPARISONS[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-white via-sky-50/50 to-indigo-50/30 dark:from-dark-900 dark:via-dark-850 dark:to-dark-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/30 text-sky-600 dark:text-cyan-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              IPC Mechanisms Architectural Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side evaluation of synchronization, buffering, memory semantics, and trade-offs
            </p>
          </div>
        </div>

        {/* High-level model comparison: Shared Memory vs Message Passing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-950/80 border border-slate-200 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 text-sky-700 dark:text-cyan-400 font-bold text-xs mb-2">
              <MessageSquare className="w-4 h-4" /> {IPC_MODELS_SUMMARY.messagePassing.title}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {IPC_MODELS_SUMMARY.messagePassing.description}
            </p>
            <div className="mt-3 text-xs space-y-1 font-medium">
              <div className="text-emerald-700 dark:text-emerald-400">✓ {IPC_MODELS_SUMMARY.messagePassing.pros}</div>
              <div className="text-amber-700 dark:text-amber-400">⚠ {IPC_MODELS_SUMMARY.messagePassing.cons}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-950/80 border border-slate-200 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs mb-2">
              <HardDrive className="w-4 h-4" /> {IPC_MODELS_SUMMARY.sharedMemory.title}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {IPC_MODELS_SUMMARY.sharedMemory.description}
            </p>
            <div className="mt-3 text-xs space-y-1 font-medium">
              <div className="text-emerald-700 dark:text-emerald-400">✓ {IPC_MODELS_SUMMARY.sharedMemory.pros}</div>
              <div className="text-amber-700 dark:text-amber-400">⚠ {IPC_MODELS_SUMMARY.sharedMemory.cons}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanism Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {IPC_COMPARISONS.map((mech) => {
          const isActive = selectedMechanism.id === mech.id;
          return (
            <button
              key={mech.id}
              onClick={() => setSelectedMechanism(mech)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-dark-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-white'
              }`}
            >
              {mech.name}
            </button>
          );
        })}
      </div>

      {/* Active Selected Mechanism Deep Dive */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 p-6 shadow-sm space-y-6 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {selectedMechanism.name}
            </h3>
            <span className="text-xs text-sky-600 dark:text-cyan-400 font-medium">
              Model: {selectedMechanism.model}
            </span>
          </div>

          {onSelectMechanism && (
            <button
              onClick={() => onSelectMechanism(selectedMechanism.id)}
              className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>Launch Interactive Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Detailed Criteria Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">Data Transfer Method</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{selectedMechanism.dataTransfer}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">Unrelated Processes Supported</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{selectedMechanism.unrelatedProcesses}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">Synchronization Requirements</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{selectedMechanism.syncRequirement}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">Buffering Behavior</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{selectedMechanism.buffering}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">Relative Performance</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{selectedMechanism.performance}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold">POSIX APIs / System Calls</span>
            <span className="text-sky-700 dark:text-cyan-400 font-bold font-mono">{selectedMechanism.posixApis}</span>
          </div>
        </div>

        {/* Pros & Cons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Key Advantages
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {selectedMechanism.advantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600">▪</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
              <X className="w-4 h-4 text-rose-600" /> Limitations & Constraints
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {selectedMechanism.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-600">▪</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-400 dark:text-slate-500 uppercase text-[10px] block font-semibold mb-1">Standard Production Use Cases</span>
          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedMechanism.useCases}</span>
        </div>
      </div>
    </div>
  );
};
