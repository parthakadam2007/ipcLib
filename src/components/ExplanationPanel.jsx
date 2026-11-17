import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Cpu, Lightbulb, Code2, Sparkles } from 'lucide-react';

export const ExplanationPanel = ({
  title = 'How It Works (Operating System Concept)',
  concept = 'Interprocess Communication',
  explanation = 'Click "Step" or "Auto Run" to observe system calls and how the operating system handles data flow.',
  syscall = null,
  kernelAction = null,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 shadow-sm backdrop-blur-md overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-dark-850/70 dark:hover:bg-dark-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {title}
            </h4>
            <span className="text-[11px] text-sky-600 dark:text-cyan-300 font-medium">
              Concept: {concept}
            </span>
          </div>
        </div>
        <div className="text-slate-400 dark:text-slate-500">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3.5 text-xs border-t border-slate-100 dark:border-slate-800">
          {/* Main Friendly Explanation */}
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans text-xs md:text-sm">
            {explanation}
          </div>

          {/* Optional Technical Syscall & Kernel details toggle */}
          {(syscall || kernelAction) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-[11px] font-semibold text-sky-600 dark:text-cyan-400 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showTechnicalDetails ? 'Hide Under-the-Hood Syscalls' : 'Show Under-the-Hood Syscalls & Kernel Logic'}</span>
              </button>

              {showTechnicalDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5 font-mono text-[11px]">
                  {syscall && (
                    <div className="bg-slate-50 dark:bg-dark-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase flex items-center gap-1 mb-1">
                        <Code2 className="w-3 h-3 text-sky-600 dark:text-sky-400" /> System Call / POSIX API
                      </div>
                      <div className="text-sky-700 dark:text-sky-300 font-bold">{syscall}</div>
                    </div>
                  )}

                  {kernelAction && (
                    <div className="bg-slate-50 dark:bg-dark-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase flex items-center gap-1 mb-1">
                        <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Kernel Space Action
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-300 font-sans">{kernelAction}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
