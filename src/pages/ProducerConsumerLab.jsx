import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Plus, Minus, AlertTriangle, ShieldCheck, Cpu, Layers, Play, Pause } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { ProducerConsumerModel } from '../ipc/producerConsumerModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const ProducerConsumerLab = () => {
  const [capacity, setCapacity] = useState(5);
  const [syncMode, setSyncMode] = useState('SEMAPHORES'); // 'SEMAPHORES' | 'MUTEX_ONLY' | 'NONE'
  const [activeScenario, setActiveScenario] = useState('');

  const [producer, setProducer] = useState(
    new Process({ id: 'P_PROD', pid: 101, name: 'Producer', role: 'Data Generator', initialVars: { produced: 0, targetSlot: 0 } })
  );
  const [consumer, setConsumer] = useState(
    new Process({ id: 'P_CONS', pid: 202, name: 'Consumer', role: 'Data Processor', initialVars: { consumed: 0, targetSlot: 0 } })
  );

  const modelRef = useRef(new ProducerConsumerModel({ capacity: 5, syncMode: 'SEMAPHORES' }));
  const [bufferSnapshot, setBufferSnapshot] = useState(modelRef.current.getSnapshot());

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'How Producer-Consumer Works',
    concept: 'Dijkstra Semaphores & Circular Buffer',
    explanation: 'Uses counting semaphore "empty" to track free slots, counting semaphore "full" to track filled slots, and binary semaphore "mutex" to serialize buffer pointer mutations.',
    syscall: 'sem_wait(&empty); sem_wait(&mutex); ... sem_post(&mutex); sem_post(&full);',
    kernelAction: 'Atomic decrement and sleep queue management without race conditions'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    if (Math.random() > 0.45) {
      handleProduce(logger, stepNumber);
    } else {
      handleConsume(logger, stepNumber);
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

  const handleProduce = (activeLogger = logger, stepNum = stepCount + 1) => {
    const pc = modelRef.current;
    const res = pc.produce(`Item-${pc.producedCount + 1}`);
    setBufferSnapshot(pc.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setProducer((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'sem_wait(&empty) BLOCKED', res.reason);
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'Producer',
          operation: 'sem_wait(&empty) BLOCKED',
          details: res.reason,
          status: 'waiting',
          stateChange: { from: 'RUNNING', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Buffer Full: Producer Blocked',
          concept: 'Counting Semaphore empty == 0',
          explanation: 'All buffer slots are occupied. The producer cannot insert without overwriting data, so it blocks on sem_wait(&empty).',
          syscall: 'sem_wait(&empty) -> blocked',
          kernelAction: 'Producer added to empty semaphore wait queue'
        });
      }
      return;
    }

    setConsumer((prev) => (prev.state === PROCESS_STATES.BLOCKED ? prev.clone() : prev));

    setProducer((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `Produced ${res.item.val} into slot ${res.slot}`);
      clone.setVariable('produced', clone.localVariables.produced + 1);
      clone.setVariable('targetSlot', pc.inIndex);
      clone.recordSent(res.item);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Producer',
      operation: 'Produce Item',
      details: `Producer inserted ${res.item.val} into slot ${res.slot}. Buffer count: ${pc.count}/${pc.capacity}`,
      data: res.item,
      status: res.race ? 'error' : 'success'
    });
  };

  const handleConsume = (activeLogger = logger, stepNum = stepCount + 1) => {
    const pc = modelRef.current;
    const res = pc.consume();
    setBufferSnapshot(pc.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setConsumer((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'sem_wait(&full) BLOCKED', res.reason);
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'Consumer',
          operation: 'sem_wait(&full) BLOCKED',
          details: res.reason,
          status: 'waiting',
          stateChange: { from: 'READY', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Buffer Empty: Consumer Blocked',
          concept: 'Counting Semaphore full == 0',
          explanation: 'The buffer contains no items. Consumer calls sem_wait(&full) and is put to sleep until producer produces an item.',
          syscall: 'sem_wait(&full) -> blocked',
          kernelAction: 'Consumer added to full semaphore wait queue'
        });
      }
      return;
    }

    setProducer((prev) => (prev.state === PROCESS_STATES.BLOCKED ? prev.clone() : prev));

    setConsumer((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `Consumed ${res.item.val} from slot ${res.slot}`);
      clone.setVariable('consumed', clone.localVariables.consumed + 1);
      clone.setVariable('targetSlot', pc.outIndex);
      clone.recordReceived(res.item);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Consumer',
      operation: 'Consume Item',
      details: `Consumer took ${res.item.val} from slot ${res.slot}. Buffer count: ${pc.count}/${pc.capacity}`,
      data: res.item,
      status: res.race ? 'error' : 'success'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.reset();
      setBufferSnapshot(modelRef.current.getSnapshot());
      setProducer(new Process({ id: 'P_PROD', pid: 101, name: 'Producer', role: 'Data Generator', initialVars: { produced: 0, targetSlot: 0 } }));
      setConsumer(new Process({ id: 'P_CONS', pid: 202, name: 'Consumer', role: 'Data Processor', initialVars: { consumed: 0, targetSlot: 0 } }));
    });
  };

  const handleSyncChange = (mode) => {
    setSyncMode(mode);
    modelRef.current.setSyncMode(mode);
    setBufferSnapshot(modelRef.current.getSnapshot());
  };

  const handleCapacityChange = (cap) => {
    const val = Math.max(2, Math.min(8, Number(cap)));
    setCapacity(val);
    modelRef.current.setCapacity(val);
    setBufferSnapshot(modelRef.current.getSnapshot());
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.producerConsumer.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.capacity) handleCapacityChange(sc.params.capacity);
    if (sc.params.syncMode) handleSyncChange(sc.params.syncMode);

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: 'sem_init() configuration',
      kernelAction: `Synchronized via ${sc.params.syncMode}`
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
        scenarios={SCENARIOS.producerConsumer}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
        customControls={
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sync:</span>
            <select
              value={syncMode}
              onChange={(e) => handleSyncChange(e.target.value)}
              className="bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-sky-700 dark:text-cyan-300 font-bold focus:outline-none"
            >
              <option value="SEMAPHORES">Dijkstra Semaphores (Safe)</option>
              <option value="MUTEX_ONLY">Mutex Only (No Counters)</option>
              <option value="NONE">None (Race Condition Demo)</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={producer}
              isHighlighted={producer.state === PROCESS_STATES.RUNNING}
              roleLabel="Producer Process"
              customIcon={Cpu}
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleProduce()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Produce Item</span>
                  </button>
                </div>
              }
            />

            <ProcessNode
              process={consumer}
              isHighlighted={consumer.state === PROCESS_STATES.RUNNING}
              roleLabel="Consumer Process"
              customIcon={Cpu}
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleConsume()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Consume Item</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Circular Bounded Buffer Visualization */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-900/90 p-4 shadow-sm backdrop-blur-md transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/30 text-sky-600 dark:text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Bounded Circular Buffer (Capacity: {capacity})
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pointers: in={bufferSnapshot.inIndex} (next write) | out={bufferSnapshot.outIndex} (next read)
                  </span>
                </div>
              </div>

              {/* Semaphore counters display */}
              <div className="flex items-center gap-2 text-xs font-mono font-medium">
                <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300">
                  empty: {bufferSnapshot.semaphores.empty}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                  full: {bufferSnapshot.semaphores.full}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                  mutex: {bufferSnapshot.semaphores.mutex}
                </span>
              </div>
            </div>

            {/* Circular Buffer Slots Array */}
            <div className="py-6 flex items-center justify-center gap-3 flex-wrap">
              {bufferSnapshot.slots.map((slotItem, idx) => {
                const isOccupied = slotItem !== null;
                const isInTarget = bufferSnapshot.inIndex === idx;
                const isOutTarget = bufferSnapshot.outIndex === idx;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex gap-1 mb-1 text-[10px] font-mono font-bold">
                      {isInTarget && <span className="text-sky-600 dark:text-cyan-400">IN ▲</span>}
                      {isOutTarget && <span className="text-emerald-600 dark:text-emerald-400">OUT ▲</span>}
                      {!isInTarget && !isOutTarget && <span className="opacity-0">-</span>}
                    </div>

                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono text-xs border-2 transition-all shadow-2xs ${
                        isOccupied
                          ? 'bg-sky-50 border-sky-400 text-sky-800 dark:bg-cyan-500/20 dark:border-cyan-400 dark:text-cyan-200 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-dark-950 dark:border-slate-800 dark:text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">Slot {idx}</span>
                      <span className="text-xs truncate px-1">
                        {isOccupied ? slotItem.val : 'EMPTY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning or Race Banner */}
            {bufferSnapshot.raceConditionDetected && (
              <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{bufferSnapshot.raceMessage || 'RACE CONDITION DETECTED!'}</span>
              </div>
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
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-900/90 shadow-sm backdrop-blur-md space-y-3.5 text-xs transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Buffer Status
            </h4>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Slots:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{bufferSnapshot.count} / {capacity}</span>
              </div>
              <div className="flex justify-between">
                <span>Produced:</span>
                <span className="text-sky-700 dark:text-cyan-400 font-bold font-mono">{bufferSnapshot.producedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Consumed:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">{bufferSnapshot.consumedCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                <span>Buffer Size</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{capacity}</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                value={capacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                className="w-full accent-sky-600 dark:accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="producer-consumer"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};
