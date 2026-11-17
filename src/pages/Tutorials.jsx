import React, { useState } from 'react';
import { GraduationCap, ArrowRight, BookOpen, AlertCircle, CheckCircle, Cpu, Clock, Layers } from 'lucide-react';
import { TUTORIALS_DATA } from '../data/tutorialsData';

export const Tutorials = ({ onLaunchSimulator }) => {
  const [selectedTutorial, setSelectedTutorial] = useState(TUTORIALS_DATA[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-white via-sky-50/50 to-indigo-50/30 dark:from-dark-900 dark:via-dark-850 dark:to-dark-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/30 text-sky-600 dark:text-cyan-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Guided Operating Systems IPC Tutorials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear visual guides, architecture diagrams, and common pitfalls explained simply
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-cyan-400 bg-sky-50 dark:bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-cyan-800/40 shadow-2xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{selectedTutorial.readTime} Interactive Guide</span>
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
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-dark-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-white'
              }`}
            >
              {tut.title}
            </button>
          );
        })}
      </div>

      {/* Main Tutorial Body */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 p-6 md:p-8 shadow-sm space-y-6 transition-colors">
        {/* Title and Launch bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30">
              {selectedTutorial.badge} Level
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {selectedTutorial.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedTutorial.subtitle}
            </p>
          </div>

          {onLaunchSimulator && selectedTutorial.targetSim && (
            <button
              onClick={() => onLaunchSimulator(selectedTutorial.targetSim)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 flex items-center gap-1.5"
            >
              <span>Open in Simulator Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Conceptual Overview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <span className="text-xs font-bold uppercase text-sky-700 dark:text-cyan-400 block mb-1">
            Conceptual Overview
          </span>
          {selectedTutorial.overview}
        </div>

        {/* Labeled Architecture Diagram Component */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-dark-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> {selectedTutorial.architecture.title}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {selectedTutorial.architecture.diagram.map((d, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs hover:border-sky-300 dark:hover:border-cyan-500/40 transition-colors"
              >
                <div className="font-bold text-sky-800 dark:text-cyan-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{d.label}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">
                  {d.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Simulation Flow */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Step-by-Step Execution Lifecycle
          </h4>

          <div className="space-y-2.5">
            {selectedTutorial.steps.map((st) => (
              <div
                key={st.step}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {st.step}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    {st.title}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {st.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-World Use Case & Common Mistakes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 dark:bg-cyan-950/20 dark:border-cyan-800/40 space-y-2 text-xs">
            <span className="font-bold uppercase text-sky-800 dark:text-cyan-300 block">
              Real-World Industry Case Study
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedTutorial.realWorldCase}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 space-y-2 text-xs">
            <span className="font-bold uppercase text-amber-800 dark:text-amber-300 block flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Common Pitfalls & Mistakes
            </span>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
              {selectedTutorial.commonMistakes.map((m, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600">▪</span>
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
