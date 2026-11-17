import React from 'react';
import { Cpu, HelpCircle, Sun, Moon, RotateCcw, Sparkles } from 'lucide-react';

export const Navbar = ({
  activePageTitle = 'Dashboard',
  isRunning = false,
  onResetSim = null,
  onOpenLegend = null,
  theme = 'light',
  onToggleTheme = null,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-2xs">
      {/* Brand & Active Simulation breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm md:text-base tracking-tight text-slate-900 dark:text-white">
            IPC Simulator
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pl-3 border-l border-slate-200 dark:border-slate-800">
          <span className="text-slate-700 dark:text-slate-200 font-medium">
            {activePageTitle}
          </span>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Real-time simulation status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono shadow-2xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
            }`}
          />
          <span className={isRunning ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </span>
        </div>

        {/* Theme Toggle Button (Light/Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-850 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 text-xs font-medium transition-all shadow-2xs"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline font-medium text-xs">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="hidden md:inline font-medium text-xs">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Legend / Visual Guide Button */}
        {onOpenLegend && (
          <button
            onClick={onOpenLegend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-dark-850 dark:hover:bg-dark-800 text-sky-700 dark:text-slate-300 border border-sky-200 dark:border-slate-700/80 text-xs font-medium transition-colors shadow-2xs"
            title="Open Simulator Visual Guide"
          >
            <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden md:inline">Guide</span>
          </button>
        )}

        {/* Quick Reset */}
        {onResetSim && (
          <button
            onClick={onResetSim}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-dark-850 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 transition-colors"
            title="Reset active simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
