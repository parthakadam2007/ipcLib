import React from 'react';
import { Cpu, HelpCircle, Activity, Sun, Moon, RotateCcw, Sparkles } from 'lucide-react';

export const Navbar = ({
  activePageTitle = 'Dashboard',
  isRunning = false,
  onResetSim = null,
  onOpenLegend = null,
  theme = 'dark',
  onToggleTheme = null,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Active Simulation breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-slate-950 font-bold shadow-md glow-cyan">
            <Cpu className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white block">
              IPC Simulator Lab
            </span>
            <span className="text-[10px] text-cyan-400 font-mono -mt-1 block font-medium">
              OS Laboratory v1.0
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 pl-3 border-l border-slate-800">
          <span>/</span>
          <span className="text-slate-200 font-semibold">{activePageTitle}</span>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Real-time simulation status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-950 border border-slate-800 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className={isRunning ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </span>
        </div>

        {/* Legend Button */}
        {onOpenLegend && (
          <button
            onClick={onOpenLegend}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono transition-colors"
            title="Open Visual Simulator Legend & Help"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Legend</span>
          </button>
        )}

        {/* Quick Reset */}
        {onResetSim && (
          <button
            onClick={onResetSim}
            className="p-1.5 rounded-lg bg-dark-850 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors"
            title="Reset active simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
