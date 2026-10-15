import React, { useState } from 'react';
import { GitCompare, Layers, Cpu, Check, X, Info, HardDrive, MessageSquare } from 'lucide-react';
import { IPC_COMPARISONS, IPC_MODELS_SUMMARY } from '../data/comparisonData';

export const Comparison = ({ onSelectMechanism }) => {
  const [selectedMechanism, setSelectedMechanism] = useState(IPC_COMPARISONS[0]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              IPC Mechanisms Architectural Matrix
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Comprehensive evaluation of synchronization, buffering, memory semantics, and trade-offs
            </p>
          </div>
        </div>

        {/* High-level model comparison: Shared Memory vs Message Passing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800/80">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-xs mb-2">
              <MessageSquare className="w-4 h-4" /> {IPC_MODELS_SUMMARY.messagePassing.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {IPC_MODELS_SUMMARY.messagePassing.description}
            </p>
            <div className="mt-3 text-[11px] font-mono space-y-1">
              <div className="text-emerald-400">✓ {IPC_MODELS_SUMMARY.messagePassing.pros}</div>
              <div className="text-amber-400">⚠ {IPC_MODELS_SUMMARY.messagePassing.cons}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-400 font-bold font-mono text-xs mb-2">
              <HardDrive className="w-4 h-4" /> {IPC_MODELS_SUMMARY.sharedMemory.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {IPC_MODELS_SUMMARY.sharedMemory.description}
            </p>
            <div className="mt-3 text-[11px] font-mono space-y-1">
              <div className="text-emerald-400">✓ {IPC_MODELS_SUMMARY.sharedMemory.pros}</div>
              <div className="text-amber-400">⚠ {IPC_MODELS_SUMMARY.sharedMemory.cons}</div>
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
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md glow-cyan'
                  : 'bg-dark-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {mech.name}
            </button>
          );
        })}
      </div>

      {/* Active Selected Mechanism Deep Dive */}
      <div className="rounded-2xl border border-slate-800 bg-dark-900/90 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide font-mono">
              {selectedMechanism.name}
            </h3>
            <span className="text-xs text-cyan-400 font-mono">
              Model: {selectedMechanism.model}
            </span>
          </div>

          {onSelectMechanism && (
            <button
              onClick={() => onSelectMechanism(selectedMechanism.id)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono font-bold transition-all"
            >
              Launch Interactive Simulator →
            </button>
          )}
        </div>

        {/* Detailed Criteria Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">Data Transfer Method</span>
            <span className="text-slate-200">{selectedMechanism.dataTransfer}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">Unrelated Processes Supported</span>
            <span className="text-slate-200">{selectedMechanism.unrelatedProcesses}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">Synchronization Requirements</span>
            <span className="text-slate-200">{selectedMechanism.syncRequirement}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">Buffering Behavior</span>
            <span className="text-slate-200">{selectedMechanism.buffering}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">Relative Performance</span>
            <span className="text-slate-200">{selectedMechanism.performance}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block font-semibold">POSIX APIs / System Calls</span>
            <span className="text-cyan-400 font-bold">{selectedMechanism.posixApis}</span>
          </div>
        </div>

        {/* Pros & Cons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Architectural Advantages
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedMechanism.advantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">▪</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <X className="w-4 h-4" /> Architectural Limitations
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedMechanism.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-400">▪</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-1">Standard Production Use Cases</span>
          <span className="text-slate-300">{selectedMechanism.useCases}</span>
        </div>
      </div>
    </div>
  );
};
