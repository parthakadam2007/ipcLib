import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, FastForward, Sliders, BookOpen, Sparkles, Activity } from 'lucide-react';

export const SimulationControls = ({
  isRunning = false,
  onRun,
  onPause,
  onStep,
  onReset,
  speed = 1,
  onSpeedChange,
  scenarios = [],
  activeScenarioId = '',
  onSelectScenario,
  syncEnabled = null,
  onToggleSync = null,
  syncLabel = 'Synchronization',
  customControls = null
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 p-3.5 shadow-sm backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Primary Playback Action Buttons */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-sm"
            title="Pause auto-execution"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
            title="Run continuous simulation"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Auto Run</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-medium text-xs transition-all ${
            isRunning
              ? 'bg-slate-100 dark:bg-dark-950 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 dark:bg-dark-850 dark:hover:bg-dark-750 dark:text-cyan-300 dark:border-cyan-500/40 shadow-2xs font-semibold'
          }`}
          title="Execute exactly one logical step"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Step Once</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-dark-850 dark:hover:bg-rose-950/30 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
          title="Reset to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-2 border-l border-r border-slate-200 dark:border-slate-800 px-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
          <FastForward className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" /> Speed:
        </span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all ${
                speed === s
                  ? 'bg-white dark:bg-cyan-500 text-sky-700 dark:text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Optional Synchronization Switch */}
      {syncEnabled !== null && onToggleSync && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{syncLabel}:</span>
          <button
            onClick={() => onToggleSync(!syncEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              syncEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
            }`}
          >
            {syncEnabled ? 'ENABLED (Safe)' : 'DISABLED (Race)'}
          </button>
        </div>
      )}

      {/* Scenario Presets Dropdown */}
      {scenarios.length > 0 && onSelectScenario && (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0" />
          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-50 dark:bg-dark-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors cursor-pointer"
          >
            <option value="">Preset Scenarios...</option>
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Extra custom controls */}
      {customControls}
    </div>
  );
};
