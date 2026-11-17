import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Radio, Zap, AlertOctagon, PauseCircle, PlayCircle, Settings, ShieldAlert } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { SignalModel, SIGNALS } from '../ipc/signalModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const SignalsSimulator = () => {
  const [selectedSignalKey, setSelectedSignalKey] = useState('SIGINT');
  const [activeScenario, setActiveScenario] = useState('');

  const [p1, setP1] = useState(
    new Process({ id: 'P1', pid: 501, name: 'Controller (Sender)', role: 'kill() Syscall Dispatcher', initialVars: { signalsDispatched: 0 } })
  );
  const [p2, setP2] = useState(
    new Process({ id: 'P2', pid: 502, name: 'Target Process', role: 'Signal Handler Trapper', initialVars: { signalsReceived: 0, lastSignal: 'NONE' } })
  );

  const modelRef = useRef(new SignalModel());
  const [signalSnapshot, setSignalSnapshot] = useState(modelRef.current.getSnapshot());
  const [inFlightSignal, setInFlightSignal] = useState(null);

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'How POSIX Signals Work',
    concept: 'Asynchronous Software Interrupts',
    explanation: 'Signals are notifications sent by the OS or another program to interrupt normal execution. They don’t carry large payloads—just an integer signal number that triggers a default action or custom trap handler.',
    syscall: 'kill(pid, sig) / sigaction(sig, &act, NULL)',
    kernelAction: 'Kernel updates the target task_struct pending signal bitmask'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    if (p2.state === PROCESS_STATES.TERMINATED) {
      handleReviveProcess();
    } else {
      const keys = ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGSTOP', 'SIGCONT'];
      const chosen = keys[Math.floor(Math.random() * keys.length)];
      handleDispatchSignal(chosen, logger, stepNumber);
    }
  }, [p2.state]);

  const {
    isRunning,
    speed,
    setSpeed,
    stepCount,
    events,
    selectedEvent,
    setSelectedEvent,
    run,
    pause,
    step,
    reset,
    clearLog,
    logger
  } = useSimulation({
    onStepExecute: handleAutoStep,
    initialSpeed: 1
  });

  const handleDispatchSignal = (sigKey = selectedSignalKey, activeLogger = logger, stepNum = stepCount + 1) => {
    const sm = modelRef.current;
    const res = sm.dispatch(sigKey, p1.pid, p2);
    setSignalSnapshot(sm.getSnapshot());

    if (!res.success) return;

    setInFlightSignal(res.event.signal);
    setTimeout(() => setInFlightSignal(null), 700);

    setP1((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `kill(${p2.pid}, ${res.event.signal.name})`);
      clone.setVariable('signalsDispatched', (clone.localVariables.signalsDispatched || 0) + 1);
      clone.recordSent(res.event.signal.name);
      return clone;
    });

    setP2((prev) => {
      const clone = prev.clone();
      clone.transitionTo(res.newState, res.outcome);
      clone.setVariable('signalsReceived', (clone.localVariables.signalsReceived || 0) + 1);
      clone.setVariable('lastSignal', res.event.signal.name);
      clone.recordReceived(res.event.signal.name);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'P1',
      operation: `kill(PID ${p2.pid}, ${res.event.signal.name})`,
      details: res.outcome,
      data: res.event.signal,
      status: res.action === 'kill' || res.action === 'terminate' ? 'error' : 'success'
    });

    setExplanationInfo({
      title: `Signal Delivered: ${res.event.signal.name} (#${res.event.signal.number})`,
      concept: res.event.signal.desc,
      explanation: `${res.outcome} Note: Signals carry only an integer number and minimal metadata, not arbitrary data streams.`,
      syscall: `kill(${p2.pid}, ${res.event.signal.name})`,
      kernelAction: `Kernel delivered signal frame to target process stack pointer`
    });
  };

  const handleReviveProcess = () => {
    setP2(new Process({ id: 'P2', pid: 502, name: 'Target Process', role: 'Signal Handler Trapper', initialVars: { signalsReceived: 0, lastSignal: 'NONE' } }));
    logger.log({
      step: stepCount + 1,
      process: 'KERNEL',
      operation: 'fork() & exec()',
      details: 'Restarted target process P2 in READY state.',
      status: 'info'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.clear();
      setSignalSnapshot(modelRef.current.getSnapshot());
      setP1(new Process({ id: 'P1', pid: 501, name: 'Controller (Sender)', role: 'kill() Syscall Dispatcher', initialVars: { signalsDispatched: 0 } }));
      setP2(new Process({ id: 'P2', pid: 502, name: 'Target Process', role: 'Signal Handler Trapper', initialVars: { signalsReceived: 0, lastSignal: 'NONE' } }));
      setInFlightSignal(null);
    });
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.signals.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.signal) setSelectedSignalKey(sc.params.signal);

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: `sigaction() setup`,
      kernelAction: `Configured signal ${sc.params.signal}`
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <SimulationControls
        isRunning={isRunning}
        onRun={run}
        onPause={pause}
        onStep={step}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        scenarios={SCENARIOS.signals}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={p1}
              isHighlighted={p1.state === PROCESS_STATES.RUNNING}
              roleLabel="Sender Process (kill() dispatcher)"
              customIcon={Radio}
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDispatchSignal(selectedSignalKey)}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Send {selectedSignalKey}</span>
                  </button>
                </div>
              }
            />

            <ProcessNode
              process={p2}
              isHighlighted={p2.state === PROCESS_STATES.RUNNING}
              roleLabel="Target Process (signal catcher)"
              customIcon={Cpu}
              extraDetails={
                p2.state === PROCESS_STATES.TERMINATED ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleReviveProcess}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-2xs"
                    >
                      Respawn Process (fork)
                    </button>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Signal Dispatcher Visual Banner */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-900/90 p-4 shadow-sm backdrop-blur-md transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                  Signal Dispatcher
                </h4>
              </div>

              {inFlightSignal && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md animate-bounce"
                >
                  ⚡ {inFlightSignal.name} DELIVERED
                </motion.span>
              )}
            </div>

            {/* Signal Picker Palette */}
            <div className="py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(SIGNALS).map(([key, sig]) => {
                const isSelected = selectedSignalKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSignalKey(key)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-cyan-500/20 border-sky-400 dark:border-cyan-400 text-sky-900 dark:text-cyan-200 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{sig.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{sig.number}</span>
                    </div>
                    <span className="text-[10px] block text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {sig.catchable ? 'Catchable' : 'Uncatchable'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <ExplanationPanel
            title={explanationInfo.title}
            concept={explanationInfo.concept}
            explanation={explanationInfo.explanation}
            syscall={explanationInfo.syscall}
            kernelAction={explanationInfo.kernelAction}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Signal Handler Table */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-900/90 shadow-sm backdrop-blur-md space-y-3.5 text-xs transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Target Process Signal Table
            </h4>

            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center text-xs">
                <span>SIGINT (2):</span>
                <span className="text-sky-700 dark:text-cyan-400 font-bold font-mono">Custom Trap Handler</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>SIGTERM (15):</span>
                <span className="text-slate-500 font-mono">Terminate (SIG_DFL)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>SIGKILL (9):</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">UNCATCHABLE</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>SIGUSR1 (10):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">User Callback</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>SIGSTOP (19):</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold font-mono">UNCATCHABLE (Freeze)</span>
              </div>
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="signals"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};
