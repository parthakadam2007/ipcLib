import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, AlertTriangle, Cpu, Layers, RotateCcw, ArrowRight, BookOpen } from 'lucide-react';
import { DeadlockModel } from '../ipc/deadlockModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const DeadlockLab = () => {
  const modelRef = useRef(new DeadlockModel());
  const [snapshot, setSnapshot] = useState(modelRef.current.getSnapshot());
  const [activeScenario, setActiveScenario] = useState('');

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'Resource Allocation Graph & Coffman Conditions',
    concept: 'Deadlock Detection and Prevention',
    explanation: 'A deadlock occurs when processes form a circular wait chain, each holding a non-preemptible resource while requesting another held by the next process.',
    syscall: 'pthread_mutex_lock(&res1); pthread_mutex_lock(&res2);',
    kernelAction: 'Scheduler detects all threads blocked on unavailable mutex locks'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    // If not deadlocked, attempt a resource request
    const dm = modelRef.current;
    if (!dm.deadlockDetected) {
      const pId = Math.random() > 0.5 ? 'P1' : 'P2';
      const rId = Math.random() > 0.5 ? 'R1' : 'R2';
      handleRequest(pId, rId, logger, stepNumber);
    }
  }, []);

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

  const handleRequest = (procId, resId, activeLogger = logger, stepNum = stepCount + 1) => {
    const dm = modelRef.current;
    const res = dm.requestResource(procId, resId);
    const updated = dm.getSnapshot();
    setSnapshot(updated);

    if (res.allocated) {
      activeLogger.log({
        step: stepNum,
        process: procId,
        operation: `Acquired ${resId}`,
        details: `${procId} successfully locked ${resId}.`,
        status: 'success'
      });
    } else if (res.blocked) {
      activeLogger.log({
        step: stepNum,
        process: procId,
        operation: `Request ${resId} BLOCKED`,
        details: `${procId} blocked: ${resId} is already held by ${res.holder}.`,
        status: 'waiting'
      });
    }

    if (updated.deadlockDetected) {
      activeLogger.log({
        step: stepNum,
        process: 'KERNEL',
        operation: 'DEADLOCK DETECTED',
        details: `Circular Wait Cycle confirmed: ${updated.deadlockCycle.join(' → ')}. All 4 Coffman conditions satisfied!`,
        status: 'error'
      });

      setExplanationInfo({
        title: 'DEADLOCK CONFIRMED: Circular Wait Detected',
        concept: 'The 4 Coffman Conditions',
        explanation: `A cycle has formed in the Resource Allocation Graph (${updated.deadlockCycle.join(' → ')}). Neither process can proceed, causing permanent freeze.`,
        syscall: 'pthread_mutex_lock() -> deadlock permanent hang',
        kernelAction: 'Processes blocked indefinitely; kernel deadlock watchdog triggered'
      });
    }
  };

  const handleRelease = (procId, resId) => {
    const dm = modelRef.current;
    const res = dm.releaseResource(procId, resId);
    setSnapshot(dm.getSnapshot());

    logger.log({
      step: stepCount + 1,
      process: procId,
      operation: `Released ${resId}`,
      details: `${procId} released ${resId}. ${res.unblocked ? `Unblocked ${res.unblocked}!` : ''}`,
      status: 'info'
    });
  };

  const handleLoadClassicDeadlock = () => {
    handleReset();
    const snap = modelRef.current.loadDeadlockScenario();
    setSnapshot(snap);

    logger.log({
      step: 1,
      process: 'KERNEL',
      operation: 'Scenario Loaded: Circular Wait Deadlock',
      details: 'P1 holds R1, requests R2. P2 holds R2, requests R1. Deadlock established.',
      status: 'error'
    });

    setExplanationInfo({
      title: 'Classic Circular Wait Deadlock Loaded',
      concept: 'Circular Dependency',
      explanation: 'P1 holds R1 and wants R2; P2 holds R2 and wants R1. Both are permanently asleep waiting for each other.',
      syscall: 'P1 locks R1 -> P2 locks R2 -> P1 asks R2 (blocks) -> P2 asks R1 (blocks)',
      kernelAction: 'Mutual wait deadlock'
    });
  };

  const handleLoadCorrected = () => {
    handleReset();
    const snap = modelRef.current.loadCorrectedScenario();
    setSnapshot(snap);

    logger.log({
      step: 1,
      process: 'KERNEL',
      operation: 'Scenario Loaded: Hierarchical Resource Ordering',
      details: 'Strict ordering rule (R1 before R2) eliminates cycle. Execution completes safely.',
      status: 'success'
    });

    setExplanationInfo({
      title: 'Deadlock Prevented via Resource Hierarchy',
      concept: 'Dijkstra Resource Ordering',
      explanation: 'By forcing processes to acquire lower-indexed resource R1 before R2, circular dependency is mathematically impossible.',
      syscall: 'Global lock order: R1 < R2 < R3',
      kernelAction: 'No cycle can form in the Resource Allocation Graph'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.reset();
      setSnapshot(modelRef.current.getSnapshot());
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
        customControls={
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadClassicDeadlock}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-mono text-xs font-semibold"
            >
              Trigger Deadlock
            </button>
            <button
              onClick={handleLoadCorrected}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-mono text-xs font-semibold"
            >
              Corrected Ordering
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          {/* Resource Allocation Graph (RAG) Visual Workspace */}
          <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    Resource Allocation Graph (RAG)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Directed Graph: Circles = Processes, Rectangles = Mutex Resources
                  </span>
                </div>
              </div>

              {snapshot.deadlockDetected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 font-bold text-xs font-mono animate-pulse">
                  ⚠ DEADLOCK DETECTED!
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs font-mono">
                  ✓ SAFE STATE (No Cycles)
                </span>
              )}
            </div>

            {/* Interactive Nodes Grid: Processes & Resources */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Processes Column */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  Processes
                </span>
                {snapshot.processes.slice(0, 2).map((proc) => {
                  const isBlocked = proc.state === 'BLOCKED';
                  const isDeadlocked = snapshot.deadlockCycle.includes(proc.id);

                  return (
                    <div
                      key={proc.id}
                      className={`p-3 rounded-xl border font-mono text-xs transition-all ${
                        isDeadlocked
                          ? 'bg-rose-950/40 border-rose-500 shadow-md glow-amber'
                          : isBlocked
                          ? 'bg-amber-950/20 border-amber-500/50'
                          : 'bg-dark-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{proc.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {proc.state}
                        </span>
                      </div>

                      <div className="text-[11px] space-y-1 text-slate-300">
                        <div>
                          Holding: <strong className="text-cyan-400">{proc.holding.join(', ') || 'None'}</strong>
                        </div>
                        <div>
                          Waiting For: <strong className="text-amber-400">{proc.waitingFor || 'None'}</strong>
                        </div>
                      </div>

                      {/* Request action buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                        <button
                          onClick={() => handleRequest(proc.id, 'R1')}
                          className="px-2 py-1 rounded bg-dark-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                        >
                          Request R1
                        </button>
                        <button
                          onClick={() => handleRequest(proc.id, 'R2')}
                          className="px-2 py-1 rounded bg-dark-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                        >
                          Request R2
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resources Column */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  Resources (Mutex Locks)
                </span>
                {snapshot.resources.slice(0, 2).map((res) => {
                  const isHeld = res.heldBy !== null;

                  return (
                    <div
                      key={res.id}
                      className={`p-3 rounded-xl border font-mono text-xs transition-all ${
                        isHeld ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-dark-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{res.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHeld ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isHeld ? `HELD BY ${res.heldBy}` : 'AVAILABLE'}
                        </span>
                      </div>

                      {isHeld && (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={() => handleRelease(res.heldBy, res.id)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold"
                          >
                            Force Release ({res.heldBy})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
          {/* Coffman Conditions Checklist Card */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> The 4 Coffman Conditions
            </h4>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span>1. Mutual Exclusion:</span>
                <span className="text-emerald-400 font-bold">YES (Exclusive)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Hold and Wait:</span>
                <span className={`font-bold ${snapshot.coffmanConditions.holdAndWait ? 'text-rose-400' : 'text-slate-500'}`}>
                  {snapshot.coffmanConditions.holdAndWait ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. No Preemption:</span>
                <span className="text-emerald-400 font-bold">YES (Protected)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. Circular Wait:</span>
                <span className={`font-bold ${snapshot.coffmanConditions.circularWait ? 'text-rose-400' : 'text-slate-500'}`}>
                  {snapshot.coffmanConditions.circularWait ? 'CYCLE DETECTED' : 'NONE'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight pt-2 border-t border-slate-800">
              Deadlock occurs if and only if ALL four conditions hold simultaneously in a single-instance resource system.
            </p>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="deadlock"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};

