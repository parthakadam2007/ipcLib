import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileCode, FolderOpen, Send, ArrowDownLeft, AlertCircle, Cpu, Link2 } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { NamedPipeModel } from '../ipc/namedPipeModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { CommunicationChannel } from '../components/CommunicationChannel';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const NamedPipeSimulator = () => {
  const [fifoPath, setFifoPath] = useState('/tmp/app_ipc.fifo');
  const [capacity, setCapacity] = useState(32);
  const [messageText, setMessageText] = useState('UNRELATED_PROC_MSG_#1');
  const [activeScenario, setActiveScenario] = useState('');

  const [writerProc, setWriterProc] = useState(
    new Process({ id: 'P_WRITER', pid: 6101, name: 'Process Alpha (Writer)', role: 'Independent Process', initialVars: { attached: false, bytesSent: 0 } })
  );
  const [readerProc, setReaderProc] = useState(
    new Process({ id: 'P_READER', pid: 7202, name: 'Process Beta (Reader)', role: 'Independent Process', initialVars: { attached: false, bytesReceived: 0 } })
  );

  const modelRef = useRef(new NamedPipeModel({ fifoPath: '/tmp/app_ipc.fifo', capacity: 32 }));
  const [fifoSnapshot, setFifoSnapshot] = useState(modelRef.current.getSnapshot());
  const [inFlightPacket, setInFlightPacket] = useState(null);

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'Named Pipes (FIFOs) via mkfifo()',
    concept: 'Filesystem-Backed IPC for Unrelated Processes',
    explanation: 'Named pipes exist as special FIFO device files in the filesystem. Any two unrelated processes with proper permissions can open the path and exchange streaming data.',
    syscall: 'mkfifo("/tmp/app_ipc.fifo", 0666); open(path, O_WRONLY);',
    kernelAction: 'Kernel creates special filesystem inode with S_IFIFO type'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    const fifo = modelRef.current;
    if (!fifo.writerAttached) {
      handleAttach('writer', logger, stepNumber);
    } else if (!fifo.readerAttached) {
      handleAttach('reader', logger, stepNumber);
    } else if (fifo.buffer.length === 0 || Math.random() > 0.5) {
      handleWrite(logger, stepNumber);
    } else {
      handleRead(logger, stepNumber);
    }
  }, [messageText]);

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

  const handleAttach = (role, activeLogger = logger, stepNum = stepCount + 1) => {
    const fifo = modelRef.current;
    const res = fifo.attachProcess(role);
    setFifoSnapshot(fifo.getSnapshot());

    if (role === 'writer') {
      setWriterProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.READY, `open("${fifoPath}", O_WRONLY)`);
        clone.setVariable('attached', true);
        return clone;
      });

      activeLogger.log({
        step: stepNum,
        process: 'Writer',
        operation: 'open(FIFO, O_WRONLY)',
        details: `Process Alpha opened FIFO file ${fifoPath} for writing.`,
        status: 'success'
      });
    } else {
      setReaderProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.READY, `open("${fifoPath}", O_RDONLY)`);
        clone.setVariable('attached', true);
        return clone;
      });

      activeLogger.log({
        step: stepNum,
        process: 'Reader',
        operation: 'open(FIFO, O_RDONLY)',
        details: `Process Beta opened FIFO file ${fifoPath} for reading. Rendezvous complete!`,
        status: 'success'
      });
    }

    setExplanationInfo({
      title: res.channelOpen ? 'FIFO Channel Open: Both Endpoints Connected' : 'Waiting on Peer Endpoint',
      concept: 'FIFO Open Synchronization',
      explanation: res.channelOpen
        ? 'Both reader and writer are now attached. In standard blocking POSIX mode, open() blocks until both sides connect.'
        : `Attached ${role}. In blocking mode, this process would sleep until the counterpart process opens the other end.`,
      syscall: `open("${fifoPath}", ${role === 'writer' ? 'O_WRONLY' : 'O_RDONLY'})`,
      kernelAction: 'Kernel checks inode reference count and wakes sleeping waiters'
    });
  };

  const handleWrite = (activeLogger = logger, stepNum = stepCount + 1) => {
    const fifo = modelRef.current;
    const text = messageText || 'DATA_SEGMENT';
    const res = fifo.write(text);
    setFifoSnapshot(fifo.getSnapshot());

    if (!res.success) {
      activeLogger.log({
        step: stepNum,
        process: 'Writer',
        operation: 'write() FAILED / BLOCKED',
        details: res.error,
        status: 'waiting'
      });
      return;
    }

    setInFlightPacket(res.writtenChunk);
    setTimeout(() => setInFlightPacket(null), 600);

    setWriterProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `write("${res.writtenChunk}")`);
      clone.setVariable('bytesSent', (clone.localVariables.bytesSent || 0) + res.writtenChunk.length);
      clone.recordSent(res.writtenChunk);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Writer',
      operation: 'write(fifo_fd, chunk)',
      details: `Writer streamed "${res.writtenChunk}" into named FIFO buffer.`,
      data: res.writtenChunk,
      status: 'success'
    });
  };

  const handleRead = (activeLogger = logger, stepNum = stepCount + 1) => {
    const fifo = modelRef.current;
    const res = fifo.read(8);
    setFifoSnapshot(fifo.getSnapshot());

    if (!res.success) {
      activeLogger.log({
        step: stepNum,
        process: 'Reader',
        operation: 'read() FAILED / BLOCKED',
        details: res.error,
        status: 'waiting'
      });
      return;
    }

    setReaderProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `read() -> "${res.data}"`);
      clone.setVariable('bytesReceived', (clone.localVariables.bytesReceived || 0) + res.data.length);
      clone.recordReceived(res.data);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Reader',
      operation: 'read(fifo_fd, 8)',
      details: `Reader consumed "${res.data}" from FIFO buffer.`,
      data: res.data,
      status: 'success'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.reset();
      setFifoSnapshot(modelRef.current.getSnapshot());
      setWriterProc(new Process({ id: 'P_WRITER', pid: 6101, name: 'Process Alpha (Writer)', role: 'Independent Process', initialVars: { attached: false, bytesSent: 0 } }));
      setReaderProc(new Process({ id: 'P_READER', pid: 7202, name: 'Process Beta (Reader)', role: 'Independent Process', initialVars: { attached: false, bytesReceived: 0 } }));
      setInFlightPacket(null);
    });
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.namedPipes.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.fifoPath) {
      setFifoPath(sc.params.fifoPath);
      modelRef.current.fifoPath = sc.params.fifoPath;
    }

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: 'mkfifo()',
      kernelAction: `Filesystem entry created at ${sc.params.fifoPath}`
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
        scenarios={SCENARIOS.namedPipes}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={writerProc}
              isHighlighted={writerProc.state === PROCESS_STATES.RUNNING}
              roleLabel="Unrelated Process Alpha"
              customIcon={Cpu}
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                  {!fifoSnapshot.writerAttached ? (
                    <button
                      onClick={() => handleAttach('writer')}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
                    >
                      open(FIFO, O_WRONLY)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleWrite()}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green disabled:opacity-50"
                    >
                      write(FIFO, chunk)
                    </button>
                  )}
                </div>
              }
            />

            <ProcessNode
              process={readerProc}
              isHighlighted={readerProc.state === PROCESS_STATES.RUNNING}
              roleLabel="Unrelated Process Beta"
              customIcon={Cpu}
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                  {!fifoSnapshot.readerAttached ? (
                    <button
                      onClick={() => handleAttach('reader')}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
                    >
                      open(FIFO, O_RDONLY)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRead()}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green disabled:opacity-50"
                    >
                      read(FIFO, 8B)
                    </button>
                  )}
                </div>
              }
            />
          </div>

          <CommunicationChannel
            title={`Filesystem FIFO [${fifoSnapshot.fifoPath}] (inode: ${fifoSnapshot.inode})`}
            channelType="fifo"
            capacity={capacity}
            currentCount={fifoSnapshot.bufferLength}
            inFlightPacket={inFlightPacket}
            customChildren={
              <div className="w-full space-y-2 my-2 font-mono text-xs">
                <div className="flex items-center justify-between px-2 text-slate-400 text-[11px]">
                  <span>Writer: {fifoSnapshot.writerAttached ? 'Connected' : 'Detached'}</span>
                  <span>Reader: {fifoSnapshot.readerAttached ? 'Connected' : 'Detached'}</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 text-slate-300 min-h-[50px] flex items-center">
                  {fifoSnapshot.buffer.length > 0 ? (
                    <span className="text-cyan-300 font-bold tracking-widest break-all">
                      {fifoSnapshot.buffer}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">FIFO buffer empty</span>
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
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" /> Filesystem Node Settings
            </h4>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">FIFO Inode Path:</label>
              <input
                type="text"
                value={fifoPath}
                onChange={(e) => setFifoPath(e.target.value)}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Payload String:</label>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="named-pipes"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};

