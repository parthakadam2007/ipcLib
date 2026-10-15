import React, { useState } from 'react';
import { GraduationCap, ArrowRight, BookOpen, AlertCircle, CheckCircle, Cpu, Clock, Layers } from 'lucide-react';
import { TUTORIALS_DATA } from '../data/tutorialsData';

export const Tutorials = ({ onLaunchSimulator }) => {
  const [selectedTutorial, setSelectedTutorial] = useState(TUTORIALS_DATA[0]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Guided Operating Systems IPC Tutorials
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Step-by-step interactive theory, architecture diagrams, and common pitfalls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-800/40">
          <Clock className="w-3.5 h-3.5" />
          <span>{selectedTutorial.readTime} Interactive Walkthrough</span>
        </div>
      </div>

      {/* Tutorial Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {TUTORIALS_DATA.map((tut) => {
          const isActive = selectedTutorial.id === tut.id;
          return (
            <button
              key={tut.id}
              onClick={() => setSelectedTutorial(tut)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md glow-cyan'
                  : 'bg-dark-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {tut.title}
            </button>
          );
        })}
      </div>

      {/* Main Tutorial Body */}
      <div className="rounded-2xl border border-slate-800 bg-dark-900/90 p-6 shadow-xl space-y-6">
        {/* Title and Launch bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
              {selectedTutorial.badge} Level
            </span>
            <h3 className="text-xl font-bold text-white mt-1.5 font-mono">
              {selectedTutorial.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTutorial.subtitle}
            </p>
          </div>

          {onLaunchSimulator && selectedTutorial.targetSim && (
            <button
              onClick={() => onLaunchSimulator(selectedTutorial.targetSim)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan flex items-center gap-1.5"
            >
              <span>Open in Simulator Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Conceptual Overview */}
        <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 text-sm leading-relaxed text-slate-300">
          <span className="text-xs font-bold font-mono uppercase text-cyan-400 block mb-1">
            Conceptual Overview
          </span>
          {selectedTutorial.overview}
        </div>

        {/* Labeled Architecture Diagram Component */}
        <div className="p-5 rounded-xl bg-dark-950/70 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> {selectedTutorial.architecture.title}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {selectedTutorial.architecture.diagram.map((d, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 font-mono text-xs space-y-1 hover:border-cyan-500/40 transition-colors"
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{d.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 pl-6">
                  {d.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Simulation Flow */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Step-by-Step Execution Lifecycle
          </h4>

          <div className="space-y-2">
            {selectedTutorial.steps.map((st) => (
              <div
                key={st.step}
                className="p-3 rounded-xl bg-dark-950/80 border border-slate-800 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {st.step}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200 font-mono">
                    {st.title}
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {st.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-World Use Case & Common Mistakes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2 text-xs">
            <span className="font-bold font-mono uppercase text-cyan-300 block">
              Real-World Industry Case Study
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedTutorial.realWorldCase}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2 text-xs">
            <span className="font-bold font-mono uppercase text-amber-300 block flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Common Pitfalls & Mistakes
            </span>
            <ul className="space-y-1 text-slate-300">
              {selectedTutorial.commonMistakes.map((m, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400">▪</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
