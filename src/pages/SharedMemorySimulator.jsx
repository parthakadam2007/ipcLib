import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Lock, Unlock, AlertTriangle, CheckCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { SharedMemoryModel } from '../ipc/sharedMemoryModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const SharedMemorySimulator = () => {
  const [synchronized, setSynchronized] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');

  const [p1, setP1] = useState(
    new Process({ id: 'P1', pid: 301, name: 'Process 1', role: 'Worker Thread A', initialVars: { localTemp: null, writeOps: 0 } })
  );
  const [p2, setP2] = useState(
    new Process({ id: 'P2', pid: 302, name: 'Process 2', role: 'Worker Thread B', initialVars: { localTemp: null, writeOps: 0 } })
  );

  const modelRef = useRef(new SharedMemoryModel({ baseAddress: '0x7FFE0400' }));
  const [shmSnapshot, setShmSnapshot] = useState(modelRef.current.getSnapshot());
  const [raceConditionDetail, setRaceConditionDetail] = useState(null);

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'Shared Memory & Virtual Memory Mapping',
    concept: 'Direct Physical RAM Sharing',
    explanation: 'Shared memory maps the exact same physical memory frames into multiple processes. Reads and writes happen at hardware memory bus speeds with zero kernel copying.',
    syscall: 'shmat(shmid, NULL, 0) / mmap(NULL, len, PROT_READ|PROT_WRITE, MAP_SHARED)',
    kernelAction: 'Page tables of both processes updated to point to the identical physical RAM page'
  });

  // Automated step: simulate concurrent increments
  const handleAutoStep = useCallback((stepNumber, logger) => {
    // Pick P1 or P2 to increment
    const activeProc = Math.random() > 0.5 ? 'P1' : 'P2';
    handleIncrementCounter(activeProc, logger, stepNumber);
  }, [synchronized]);

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

  // Increment counter logic:
  // With sync: acquire mutex -> read -> increment -> write -> release mutex
  // Without sync: both read same value -> both write same increment => LOST UPDATE!
  const handleIncrementCounter = (procId, activeLogger = logger, stepNum = stepCount + 1) => {
    const shm = modelRef.current;
    const currentVal = shm.read('counter');

    if (synchronized) {
      // Synchronized path with Mutex
      const lockRes = shm.acquireMutex(procId);
      if (!lockRes.success) {
        // Mutex is locked by someone else
        const targetProc = procId === 'P1' ? setP1 : setP2;
        targetProc((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'Waiting for Mutex Lock', lockRes.error);
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: procId,
          operation: 'pthread_mutex_lock() BLOCKED',
          details: `${procId} blocked: Mutex held by ${shm.mutex.holder}. Awaiting release.`,
          status: 'waiting',
          stateChange: { from: 'READY', to: 'BLOCKED' }
        });
        setShmSnapshot(shm.getSnapshot());
        return;
      }

      // Lock acquired! Critical section
      const newVal = currentVal + 1;
      shm.write('counter', newVal, procId, true);
      shm.releaseMutex(procId);

      const targetProc = procId === 'P1' ? setP1 : setP2;
      targetProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.RUNNING, `counter++ (${currentVal} -> ${newVal})`);
        clone.setVariable('localTemp', newVal);
        clone.setVariable('writeOps', (clone.localVariables.writeOps || 0) + 1);
        return clone;
      });

      // Unblock other process if it was waiting
      setP1((prev) => (prev.state === PROCESS_STATES.BLOCKED ? prev.clone() : prev));
      setP2((prev) => (prev.state === PROCESS_STATES.BLOCKED ? prev.clone() : prev));

      setShmSnapshot(shm.getSnapshot());
      setRaceConditionDetail(null);

      activeLogger.log({
        step: stepNum,
        process: procId,
        operation: 'Atomic Increment (Synchronized)',
        details: `${procId} acquired mutex, safely incremented counter from ${currentVal} to ${newVal}, and released mutex.`,
        data: { oldValue: currentVal, newValue: newVal, lock: 'MUTEX_OK' },
        status: 'success'
      });

      setExplanationInfo({
        title: 'Critical Section Executed Safely with Mutex',
        concept: 'Mutual Exclusion (pthread_mutex)',
        explanation: `Process ${procId} held the mutex lock while updating the memory word. Mutual exclusion was preserved, guaranteeing atomic serialization.`,
        syscall: 'pthread_mutex_lock() -> write -> pthread_mutex_unlock()',
        kernelAction: 'Atomic test-and-set instruction succeeded; no interference'
      });
    } else {
      // Unsynchronized path: simulate concurrent interleaving race condition
      const isRace = Math.random() > 0.4;
      const newVal = currentVal + 1;

      if (isRace) {
        // Race condition: P1 and P2 read the same value, both write 11 -> one update LOST!
        shm.write('counter', newVal, procId, false);
        shm.raceConditionDetected = true;

        const raceInfo = {
          step: stepNum,
          expected: currentVal + 2,
          actual: newVal,
          lostUpdates: 1,
          details: `Both P1 and P2 read counter=${currentVal} concurrently before writeback. One update was completely lost!`
        };
        setRaceConditionDetail(raceInfo);

        const targetProc = procId === 'P1' ? setP1 : setP2;
        targetProc((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.RUNNING, `RACE: Overwrote counter to ${newVal}`);
          clone.setVariable('localTemp', newVal);
          clone.setVariable('writeOps', (clone.localVariables.writeOps || 0) + 1);
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: procId,
          operation: 'RACE CONDITION DETECTED',
          details: `UNSYNCHRONIZED WRITE: Both processes read ${currentVal}. Expected ${currentVal + 2}, but memory shows ${newVal}. Lost update!`,
          status: 'error',
          data: { expected: currentVal + 2, actual: newVal }
        });

        setExplanationInfo({
          title: 'Race Condition Occurred: Lost Update',
          concept: 'Lack of Mutual Exclusion',
          explanation: `Without synchronization locks, the read-modify-write cycle (1. Load from RAM, 2. Add 1 in CPU register, 3. Store back) was interleaved between processes. The second write wiped out the first!`,
          syscall: 'Direct RAM pointer write (Unsynchronized *ptr = val)',
          kernelAction: 'Hardware memory controller committed write without synchronization barrier'
        });
      } else {
        shm.write('counter', newVal, procId, false);
        const targetProc = procId === 'P1' ? setP1 : setP2;
        targetProc((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.RUNNING, `counter = ${newVal}`);
          clone.setVariable('localTemp', newVal);
          clone.setVariable('writeOps', (clone.localVariables.writeOps || 0) + 1);
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: procId,
          operation: 'Unsynchronized Write',
          details: `${procId} updated counter to ${newVal} without lock.`,
          status: 'success'
        });
      }

      setShmSnapshot(shm.getSnapshot());
    }
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.reset();
      setShmSnapshot(modelRef.current.getSnapshot());
      setP1(new Process({ id: 'P1', pid: 301, name: 'Process 1', role: 'Worker Thread A', initialVars: { localTemp: null, writeOps: 0 } }));
      setP2(new Process({ id: 'P2', pid: 302, name: 'Process 2', role: 'Worker Thread B', initialVars: { localTemp: null, writeOps: 0 } }));
      setRaceConditionDetail(null);
    });
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.sharedMemory.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    setSynchronized(sc.params.synchronized);

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: sc.params.synchronized ? 'pthread_mutex_init()' : 'shmget() without locks',
      kernelAction: sc.params.synchronized ? 'Configured mutex for critical sections' : 'Unprotected shared memory mapping'
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
        syncEnabled={synchronized}
        onToggleSync={setSynchronized}
        syncLabel="Mutex Locking"
        scenarios={SCENARIOS.sharedMemory}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={p1}
              isHighlighted={p1.state === PROCESS_STATES.RUNNING}
              roleLabel="Process 1 (shm access)"
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleIncrementCounter('P1')}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>P1: counter++</span>
                  </button>
                </div>
              }
            />

            <ProcessNode
              process={p2}
              isHighlighted={p2.state === PROCESS_STATES.RUNNING}
              roleLabel="Process 2 (shm access)"
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleIncrementCounter('P2')}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>P2: counter++</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Shared Memory Segment Visual Representation */}
          <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    Shared Physical Memory Segment [{shmSnapshot.baseAddress}]
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zero-Copy RAM Frame mapped to both process address spaces
                  </span>
                </div>
              </div>

              {/* Mutex State Indicator */}
              <div className="flex items-center gap-2 font-mono text-xs">
                {shmSnapshot.mutex.locked ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" /> LOCKED by {shmSnapshot.mutex.holder}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                    <Unlock className="w-3 h-3" /> UNLOCKED (Free)
                  </span>
                )}
              </div>
            </div>

            {/* Memory Word Values */}
            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block">OFFSET 0x00</span>
                <span className="text-xs font-semibold text-slate-400">counter</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {shmSnapshot.memory.counter}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block">OFFSET 0x04</span>
                <span className="text-xs font-semibold text-slate-400">lastUpdatedBy</span>
                <div className="text-base font-bold text-purple-400 mt-2">
                  {shmSnapshot.memory.lastUpdatedBy}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block">OFFSET 0x08</span>
                <span className="text-xs font-semibold text-slate-400">syncMode</span>
                <div className={`text-sm font-bold mt-2 ${synchronized ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {synchronized ? 'MUTEX_LOCKED' : 'UNSYNCHRONIZED'}
                </div>
              </div>
            </div>

            {/* Race Condition Banner if detected */}
            {raceConditionDetail && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs font-mono space-y-1 mt-2"
              >
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>RACE CONDITION CONFIRMED (Lost Update)</span>
                </div>
                <div className="text-[11px] text-rose-200/90 pl-6">
                  {raceConditionDetail.details}
                </div>
                <div className="text-[10px] text-rose-300 font-bold pl-6">
                  Expected value: {raceConditionDetail.expected} | Actual stored value: {raceConditionDetail.actual}
                </div>
              </motion.div>
            )}
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
          {/* Synchronized vs Unsynchronized Deep Dive card */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Synchronization State
            </h4>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-xs">
                <span>Mutex Protocol:</span>
                <span className={`font-bold ${synchronized ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {synchronized ? 'POSIX PTHREAD_MUTEX' : 'NONE (Race Prone)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Waiting Queue:</span>
                <span className="text-slate-400 font-bold">
                  {shmSnapshot.mutex.waitingCount} process(es)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setSynchronized(!synchronized)}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs font-mono transition-all border ${
                  synchronized
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {synchronized ? 'Disable Mutex (Demonstrate Race)' : 'Enable Mutex (Ensure Atomicity)'}
              </button>
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="shared-memory"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};

