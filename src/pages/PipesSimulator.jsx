import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, Send, ArrowDownLeft, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { PipeModel } from '../ipc/pipeModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { CommunicationChannel } from '../components/CommunicationChannel';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const PipesSimulator = () => {
  const [capacity, setCapacity] = useState(32); // 32 bytes
  const [chunkSize, setChunkSize] = useState(8);
  const [inputData, setInputData] = useState('Operating Systems Kernel IPC Stream Data');
  const [activeScenario, setActiveScenario] = useState('');

  const [p1, setP1] = useState(
    new Process({ id: 'P1', pid: 1010, name: 'Parent (Writer)', role: 'fd[1] Write End', initialVars: { bytesWritten: 0 } })
  );
  const [p2, setP2] = useState(
    new Process({ id: 'P2', pid: 1011, name: 'Child (Reader)', role: 'fd[0] Read End', initialVars: { bytesRead: 0, lastRead: '' } })
  );

  const modelRef = useRef(new PipeModel({ capacity: 32 }));
  const [pipeSnapshot, setPipeSnapshot] = useState(modelRef.current.getSnapshot());
  const [inFlightPacket, setInFlightPacket] = useState(null);

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'How Anonymous Pipes Work',
    concept: 'Unidirectional Byte-Stream Channel',
    explanation: 'An anonymous pipe is a memory buffer managed by the operating system kernel. A parent process creates the pipe, forks a child process, and they stream raw bytes through standard file descriptors.',
    syscall: 'int pipe(int fd[2]); // fd[0]=read, fd[1]=write',
    kernelAction: 'Kernel allocates circular memory buffer and returns descriptor pair'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    const pipe = modelRef.current;
    if (pipe.isEmpty() || Math.random() > 0.45) {
      handleWrite(logger, stepNumber);
    } else {
      handleRead(logger, stepNumber);
    }
  }, [chunkSize, inputData]);

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

  const handleWrite = (activeLogger = logger, stepNum = stepCount + 1) => {
    const pipe = modelRef.current;
    const writeSlice = inputData.slice(0, chunkSize) || 'STREAM_CHUNK_';
    const res = pipe.write(writeSlice);
    setPipeSnapshot(pipe.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setP1((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'write() BLOCKED', 'Pipe buffer is full');
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'P1',
          operation: 'write(fd[1]) BLOCKED',
          details: `Parent blocked attempting to write ${writeSlice.length} bytes to full pipe (${pipe.buffer.length}/${pipe.capacity} bytes).`,
          status: 'waiting',
          stateChange: { from: 'RUNNING', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Pipe Buffer Saturation: Writer Blocked',
          concept: 'Kernel Flow Control & Backpressure',
          explanation: 'When a process writes to a full pipe, the OS scheduler moves the process to the wait queue until the reader frees buffer space.',
          syscall: 'write(fd[1], buf, len) -> blocked in sys_write',
          kernelAction: 'Kernel suspends P1 and invokes schedule() to yield CPU'
        });
      }
      return;
    }

    setInFlightPacket(res.writtenChunk);
    setTimeout(() => setInFlightPacket(null), 600);

    setP1((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `write(fd[1], "${res.writtenChunk}", ${res.bytesWritten})`);
      clone.setVariable('bytesWritten', (clone.localVariables.bytesWritten || 0) + res.bytesWritten);
      clone.recordSent(res.writtenChunk);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'P1',
      operation: 'write(fd[1])',
      details: `Parent wrote ${res.bytesWritten} bytes: "${res.writtenChunk}" into pipe buffer.`,
      data: res.writtenChunk,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Data Written to Kernel Pipe Buffer',
      concept: 'Circular Byte Buffer Ingestion',
      explanation: `Parent wrote ${res.bytesWritten} bytes into the kernel pipe ring buffer. The buffer occupancy is now ${pipe.buffer.length}/${pipe.capacity} bytes.`,
      syscall: `write(fd[1], "${res.writtenChunk}", ${res.bytesWritten})`,
      kernelAction: 'Kernel copies bytes from user space into pipe buffer'
    });
  };

  const handleRead = (activeLogger = logger, stepNum = stepCount + 1) => {
    const pipe = modelRef.current;
    const res = pipe.read(chunkSize);
    setPipeSnapshot(pipe.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setP2((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'read() BLOCKED', 'Pipe buffer is empty');
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'P2',
          operation: 'read(fd[0]) BLOCKED',
          details: 'Child called read() on an empty pipe buffer. Process blocked waiting for writer.',
          status: 'waiting',
          stateChange: { from: 'READY', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Empty Pipe: Reader Process Blocked',
          concept: 'Blocking Read Semantics',
          explanation: 'Reading from an empty pipe blocks until at least one byte is written or all write file descriptors are closed (EOF).',
          syscall: 'read(fd[0], buf, count) -> blocked',
          kernelAction: 'P2 placed on pipe wait_queue; CPU yields to other tasks'
        });
      }
      return;
    }

    // Unblock P1 if it was blocked on full
    setP1((prev) => {
      if (prev.state === PROCESS_STATES.BLOCKED) {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.READY, 'Unblocked: space freed in pipe');
        return clone;
      }
      return prev;
    });

    setP2((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `read(fd[0]) -> "${res.data}"`);
      clone.setVariable('bytesRead', (clone.localVariables.bytesRead || 0) + res.bytesRead);
      clone.setVariable('lastRead', res.data);
      clone.recordReceived(res.data);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'P2',
      operation: 'read(fd[0])',
      details: `Child read ${res.bytesRead} bytes: "${res.data}" from pipe.`,
      data: res.data,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Bytes Drained from Pipe Buffer',
      concept: 'FIFO Stream Consumption',
      explanation: `Child consumed ${res.bytesRead} bytes. The pipe buffer occupancy dropped to ${pipe.buffer.length}/${pipe.capacity} bytes.`,
      syscall: `read(fd[0], buf, ${res.bytesRead})`,
      kernelAction: 'Kernel copies bytes to user buffer and advances read pointer'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.clear();
      setPipeSnapshot(modelRef.current.getSnapshot());
      setP1(new Process({ id: 'P1', pid: 1010, name: 'Parent (Writer)', role: 'fd[1] Write End', initialVars: { bytesWritten: 0 } }));
      setP2(new Process({ id: 'P2', pid: 1011, name: 'Child (Reader)', role: 'fd[0] Read End', initialVars: { bytesRead: 0, lastRead: '' } }));
      setInFlightPacket(null);
    });
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.pipes.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.capacity) {
      setCapacity(sc.params.capacity);
      modelRef.current.capacity = sc.params.capacity;
    }
    if (sc.params.chunk) setChunkSize(sc.params.chunk);
    if (sc.params.message !== undefined) setInputData(sc.params.message);

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: 'pipe() initialization',
      kernelAction: `Allocated ${sc.params.capacity || 32} byte circular pipe buffer`
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
        scenarios={SCENARIOS.pipes}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={p1}
              isHighlighted={p1.state === PROCESS_STATES.RUNNING}
              roleLabel="Parent Process (fd[1] Writer)"
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleWrite()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>write(fd[1], {chunkSize}B)</span>
                  </button>
                </div>
              }
            />

            <ProcessNode
              process={p2}
              isHighlighted={p2.state === PROCESS_STATES.RUNNING}
              roleLabel="Child Process (fd[0] Reader)"
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleRead()}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>read(fd[0], {chunkSize}B)</span>
                  </button>
                </div>
              }
            />
          </div>

          <CommunicationChannel
            title="Kernel Pipe Ring Buffer"
            channelType="pipe"
            capacity={capacity}
            currentCount={pipeSnapshot.length}
            isFull={pipeSnapshot.isFull}
            isEmpty={pipeSnapshot.isEmpty}
            inFlightPacket={inFlightPacket}
            customChildren={
              <div className="w-full space-y-2 my-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
                  <span>Write Influx (fd[1])</span>
                  <span>Read Outflow (fd[0])</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 min-h-[55px] flex items-center shadow-2xs">
                  {pipeSnapshot.buffer.length > 0 ? (
                    <span className="text-sky-700 dark:text-cyan-300 font-bold tracking-widest break-all">
                      {pipeSnapshot.buffer}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic font-sans text-xs">Pipe buffer is empty [0 bytes]</span>
                  )}
                </div>
              </div>
            }
          />

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
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Pipe Configuration
            </h4>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Writer Stream Data:</label>
              <input
                type="text"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Chunk Size (Bytes):</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Capacity (Bytes):</label>
                <input
                  type="number"
                  min="8"
                  max="64"
                  value={capacity}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setCapacity(c);
                    modelRef.current.capacity = c;
                    setPipeSnapshot(modelRef.current.getSnapshot());
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs"
                />
              </div>
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="pipes"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};
