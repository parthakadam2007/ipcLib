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
    title: 'The Bounded-Buffer Producer–Consumer Problem',
    concept: 'Dijkstra Semaphores & Circular Buffer',
    explanation: 'Uses counting semaphore "empty" to track free slots, counting semaphore "full" to track filled slots, and binary semaphore "mutex" to serialize buffer pointer mutations.',
    syscall: 'sem_wait(&empty); sem_wait(&mutex); ... sem_post(&mutex); sem_post(&full);',
    kernelAction: 'Atomic decrement and sleep queue management without race conditions'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    // Alternate or probabilistically choose produce vs consume
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

    // Unblock consumer if it was blocked
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

    // Unblock producer if blocked
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
    <div className="space-y-4">
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
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Sync:</span>
            <select
              value={syncMode}
              onChange={(e) => handleSyncChange(e.target.value)}
              className="bg-dark-950 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 font-semibold focus:outline-none"
            >
              <option value="SEMAPHORES">Dijkstra Semaphores (Safe)</option>
              <option value="MUTEX_ONLY">Mutex Only (No Semaphores)</option>
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
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleProduce()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
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
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleConsume()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Consume Item</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Circular Bounded Buffer Visualization */}
          <div className="rounded-xl border border-slate-700/80 bg-dark-900/90 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    Bounded Circular Buffer (Capacity: {capacity})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Pointers: in={bufferSnapshot.inIndex} (next write) | out={bufferSnapshot.outIndex} (next read)
                  </span>
                </div>
              </div>

              {/* Semaphore counters display */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">
                  empty: {bufferSnapshot.semaphores.empty}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  full: {bufferSnapshot.semaphores.full}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                  mutex: {bufferSnapshot.semaphores.mutex}
                </span>
              </div>
            </div>

            {/* Circular Buffer Slots Array */}
            <div className="py-5 flex items-center justify-center gap-2 flex-wrap">
              {bufferSnapshot.slots.map((slotItem, idx) => {
                const isOccupied = slotItem !== null;
                const isInTarget = bufferSnapshot.inIndex === idx;
                const isOutTarget = bufferSnapshot.outIndex === idx;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex gap-1 mb-1 text-[9px] font-mono">
                      {isInTarget && <span className="text-cyan-400 font-bold">IN▲</span>}
                      {isOutTarget && <span className="text-emerald-400 font-bold">OUT▲</span>}
                    </div>

                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono text-xs border-2 transition-all ${
                        isOccupied
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md glow-cyan font-bold'
                          : 'bg-dark-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500">[{idx}]</span>
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
              <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
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
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Synchronization Model
            </h4>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Buffer Slots:</span>
                <span className="font-bold text-white">{bufferSnapshot.count} / {capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Produced:</span>
                <span className="text-cyan-400 font-bold">{bufferSnapshot.producedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Consumed:</span>
                <span className="text-emerald-400 font-bold">{bufferSnapshot.consumedCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">Adjust Buffer Size:</label>
              <input
                type="range"
                min="2"
                max="8"
                value={capacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
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
