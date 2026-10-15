import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Cpu, Lightbulb, Code2 } from 'lucide-react';

export const ExplanationPanel = ({
  title = 'Operating System Concept Insight',
  concept = 'Interprocess Communication (IPC)',
  explanation = 'Click "Run" or "Step" to observe system calls and kernel state transitions.',
  syscall = null,
  kernelAction = null,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-lg backdrop-blur-md overflow-hidden text-slate-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-dark-850/70 hover:bg-dark-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              {title}
            </h4>
            <span className="text-[10px] text-cyan-300 font-mono">
              Topic: {concept}
            </span>
          </div>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs border-t border-slate-800">
          {/* Main Conceptual Explanation */}
          <div className="text-slate-300 leading-relaxed font-sans">
            {explanation}
          </div>

          {/* Syscall and Kernel Actions Grid */}
          {(syscall || kernelAction) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
              {syscall && (
                <div className="bg-dark-950/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 mb-0.5">
                    <Code2 className="w-3 h-3 text-sky-400" /> System Call / POSIX API
                  </div>
                  <div className="text-sky-300 font-bold">{syscall}</div>
                </div>
              )}

              {kernelAction && (
                <div className="bg-dark-950/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 mb-0.5">
                    <Cpu className="w-3 h-3 text-emerald-400" /> Kernel Space Action
                  </div>
                  <div className="text-emerald-300">{kernelAction}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
