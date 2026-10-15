import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, FastForward, Sliders, BookOpen } from 'lucide-react';

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
    <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 p-3 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-slate-200">
      {/* Primary Playback Action Buttons */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-semibold text-xs font-mono shadow-sm"
            title="Pause auto-execution"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-bold text-xs font-mono shadow-md glow-green"
            title="Run continuous simulation"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-dark-950 text-slate-400 border-slate-800 cursor-not-allowed opacity-60'
              : 'bg-dark-850 hover:bg-dark-750 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-sm'
          }`}
          title="Execute exactly one deterministic logical step"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Step</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-rose-950/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 font-mono text-xs transition-colors"
          title="Reset simulation to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-2 border-l border-r border-slate-800 px-3">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <FastForward className="w-3 h-3 text-cyan-400" /> Speed:
        </span>
        <div className="flex items-center gap-1 bg-dark-950 p-0.5 rounded-lg border border-slate-800">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                speed === s
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
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
          <span className="text-[11px] font-mono text-slate-300">{syncLabel}:</span>
          <button
            onClick={() => onToggleSync(!syncEnabled)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
              syncEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {syncEnabled ? 'ENABLED (Locked)' : 'DISABLED (Race)'}
          </button>
        </div>
      )}

      {/* Scenario Presets Dropdown */}
      {scenarios.length > 0 && onSelectScenario && (
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-dark-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 px-2 py-1.5 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
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
