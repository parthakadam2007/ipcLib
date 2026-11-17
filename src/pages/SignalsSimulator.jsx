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
    title: 'POSIX Asynchronous Signals (Software Interrupts)',
    concept: 'Kernel-to-Process Notification',
    explanation: 'Signals notify a process that an event has occurred. The kernel interrupts the target process\'s normal execution flow to execute a registered signal handler or the OS default action.',
    syscall: 'kill(pid, sig) / sigaction(sig, &act, NULL)',
    kernelAction: 'Kernel updates the target task_struct pending signal bitmask'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    // Pick a signal that won't terminate immediately every time, or revive if terminated
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

    // Update P1 (Sender)
    setP1((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `kill(${p2.pid}, ${res.event.signal.name})`);
      clone.setVariable('signalsDispatched', (clone.localVariables.signalsDispatched || 0) + 1);
      clone.recordSent(res.event.signal.name);
      return clone;
    });

    // Update P2 (Target)
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
    <div className="space-y-4">
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
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleDispatchSignal(selectedSignalKey)}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
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
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={handleReviveProcess}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs font-mono transition-colors"
                    >
                      Respawn Process (fork)
                    </button>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Signal Dispatcher Visual Banner */}
          <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    Software Interrupt Delivery Channel
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Asynchronous Kernel-Level Notification Delivery
                  </span>
                </div>
              </div>

              {inFlightSignal && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 font-bold text-xs font-mono animate-bounce"
                >
                  ⚡ {inFlightSignal.name} IN FLIGHT
                </motion.span>
              )}
            </div>

            {/* Signal Picker Palette */}
            <div className="py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(SIGNALS).map(([key, sig]) => {
                const isSelected = selectedSignalKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSignalKey(key)}
                    className={`p-2 rounded-lg border font-mono text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                        : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{sig.name}</span>
                      <span className="text-[9px] text-slate-500">#{sig.number}</span>
                    </div>
                    <span className="text-[9px] block text-slate-500 mt-1 truncate">
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
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" /> Target Signal Table
            </h4>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between items-center text-[11px]">
                <span>SIGINT (2):</span>
                <span className="text-cyan-400 font-bold">sigaction(custom_handler)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span>SIGTERM (15):</span>
                <span className="text-slate-400">SIG_DFL (Terminate)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span>SIGKILL (9):</span>
                <span className="text-rose-400 font-bold">CANNOT BE CAUGHT</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span>SIGUSR1 (10):</span>
                <span className="text-emerald-400 font-bold">User Handler</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span>SIGSTOP (19):</span>
                <span className="text-amber-400 font-bold">CANNOT BE CAUGHT</span>
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

