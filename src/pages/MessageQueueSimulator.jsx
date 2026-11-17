import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ArrowDownLeft, ShieldAlert, Cpu, Sparkles, Filter, Plus, ArrowRight } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { MessageQueueModel } from '../ipc/messageQueueModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { CommunicationChannel } from '../components/CommunicationChannel';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const MessageQueueSimulator = () => {
  // IPC Model State
  const [capacity, setCapacity] = useState(5);
  const [mode, setMode] = useState('FIFO'); // 'FIFO' or 'PRIORITY'
  const [isNonBlocking, setIsNonBlocking] = useState(false);
  
  // Custom message input
  const [customMsgText, setCustomMsgText] = useState('Job Payload 42');
  const [customPriority, setCustomPriority] = useState(3);
  const [activeScenario, setActiveScenario] = useState('');

  // Process States
  const [p1, setP1] = useState(
    new Process({ id: 'P1', pid: 1042, name: 'P1 (Sender)', role: 'Writer Process', initialVars: { queued: 0 } })
  );
  const [p2, setP2] = useState(
    new Process({ id: 'P2', pid: 2098, name: 'P2 (Receiver)', role: 'Worker Process', initialVars: { processed: 0 } })
  );

  const modelRef = useRef(new MessageQueueModel({ capacity: 5, mode: 'FIFO' }));
  const [queueSnapshot, setQueueSnapshot] = useState(modelRef.current.getSnapshot());
  const [inFlightPacket, setInFlightPacket] = useState(null);
  const [explanationInfo, setExplanationInfo] = useState({
    title: 'How Message Queues Work',
    concept: 'Discrete Prioritized Message Passing',
    explanation: 'Unlike continuous byte streams (like pipes), message queues store distinct packets with explicit message boundaries and priority levels. The kernel coordinates senders and receivers automatically.',
    syscall: 'mq_open("/lab_mq", O_CREAT | O_RDWR)',
    kernelAction: 'Kernel initializes priority linked list and allocates descriptor'
  });

  // Automated step logic for continuous execution
  const handleAutoStep = useCallback((stepNumber, logger) => {
    const mq = modelRef.current;
    if (mq.isEmpty() || Math.random() > 0.45) {
      handleSendMessage(logger, stepNumber);
    } else {
      handleReceiveMessage(logger, stepNumber);
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

  // Send Message Logic
  const handleSendMessage = (activeLogger = logger, stepNum = stepCount + 1) => {
    const mq = modelRef.current;
    const msgData = {
      id: `M-${Math.floor(Math.random() * 900) + 100}`,
      content: customMsgText || `Sensor Data #${stepNum}`,
      priority: Number(customPriority),
      sender: 'P1',
      recipient: 'P2'
    };

    const res = mq.enqueue(msgData, isNonBlocking);
    setQueueSnapshot(mq.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setP1((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'mq_send() blocked: Queue Full', 'Queue capacity reached (5/5)');
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'P1',
          operation: 'mq_send() BLOCKED',
          details: `P1 attempted to send message "${msgData.content}", but queue is full (${mq.capacity}/${mq.capacity}). Writer blocked.`,
          status: 'waiting',
          stateChange: { from: 'RUNNING', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Buffer Saturation: Process Blocked on mq_send',
          concept: 'Kernel Flow Control & Process Sleeping',
          explanation: `The message queue has reached its maximum configured capacity of ${mq.capacity} messages. The calling process is moved off the CPU run-queue into a sleep wait queue until space becomes available.`,
          syscall: isNonBlocking ? 'mq_send() -> EAGAIN' : 'mq_send() -> blocked in kernel',
          kernelAction: 'Process P1 task_struct marked TASK_INTERRUPTIBLE and placed on wait_queue_head'
        });
      } else {
        activeLogger.log({
          step: stepNum,
          process: 'P1',
          operation: 'mq_send() FAILED (EAGAIN)',
          details: 'Queue is full and non-blocking O_NONBLOCK was set. Message dropped.',
          status: 'error'
        });
      }
      return;
    }

    // Success
    setInFlightPacket(res.message);
    setTimeout(() => setInFlightPacket(null), 700);

    setP1((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `mq_send("${res.message.content}", prio=${res.message.priority})`);
      clone.setVariable('queued', (clone.localVariables.queued || 0) + 1);
      clone.recordSent(res.message);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'P1',
      operation: 'mq_send() Enqueue',
      details: `P1 inserted message "${res.message.content}" with priority ${res.message.priority} into kernel queue.`,
      data: res.message,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Message Enqueued Successfully',
      concept: mode === 'PRIORITY' ? 'Priority Queue Scheduling' : 'FIFO Queue Ingestion',
      explanation: mode === 'PRIORITY'
        ? `Message was ordered by priority ${res.message.priority}. Higher priority messages will be dequeued first, regardless of arrival order.`
        : `Message appended to tail of FIFO list. Messages are consumed in exact order of arrival.`,
      syscall: `mq_send(mqdes, msg, len, prio=${res.message.priority})`,
      kernelAction: 'Kernel copies user buffer into kmalloc message node and updates queue pointers'
    });
  };

  // Receive Message Logic
  const handleReceiveMessage = (activeLogger = logger, stepNum = stepCount + 1) => {
    const mq = modelRef.current;
    const res = mq.dequeue(isNonBlocking);
    setQueueSnapshot(mq.getSnapshot());

    if (!res.success) {
      if (res.blocked) {
        setP2((prev) => {
          const clone = prev.clone();
          clone.transitionTo(PROCESS_STATES.BLOCKED, 'mq_receive() blocked: Queue Empty', 'No messages in queue');
          return clone;
        });

        activeLogger.log({
          step: stepNum,
          process: 'P2',
          operation: 'mq_receive() BLOCKED',
          details: 'P2 called mq_receive(), but the queue is empty. Receiver blocked.',
          status: 'waiting',
          stateChange: { from: 'READY', to: 'BLOCKED' }
        });

        setExplanationInfo({
          title: 'Empty Queue: Consumer Process Blocked',
          concept: 'Blocking Receive Syscall',
          explanation: 'When mq_receive() is called on an empty queue, the process is put to sleep until a message is sent. This prevents wasteful CPU busy-waiting.',
          syscall: isNonBlocking ? 'mq_receive() -> ENOMSG' : 'mq_receive() -> blocked',
          kernelAction: 'P2 state changed to TASK_INTERRUPTIBLE awaiting queue wake_up_interruptible'
        });
      } else {
        activeLogger.log({
          step: stepNum,
          process: 'P2',
          operation: 'mq_receive() FAILED (ENOMSG)',
          details: 'Queue is empty and non-blocking mode returned ENOMSG immediately.',
          status: 'error'
        });
      }
      return;
    }

    // Success
    setP1((prev) => {
      if (prev.state === PROCESS_STATES.BLOCKED) {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.READY, 'Unblocked: space freed in queue');
        return clone;
      }
      return prev;
    });

    setP2((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, `Processed: "${res.message.content}"`);
      clone.setVariable('processed', (clone.localVariables.processed || 0) + 1);
      clone.setVariable('lastPrio', res.message.priority);
      clone.recordReceived(res.message);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'P2',
      operation: 'mq_receive() Dequeue',
      details: `P2 extracted message "${res.message.content}" (Priority: ${res.message.priority}).`,
      data: res.message,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Message Dequeued & Dispatched',
      concept: 'Atomic Message Extraction',
      explanation: `Process P2 read message [${res.message.id}]. The kernel removed the message node and copied payload into P2's user space memory buffer.`,
      syscall: `mq_receive(mqdes, &buf, msg_len, &prio)`,
      kernelAction: 'Kernel dequeues head node, copies to user space, frees kernel memory'
    });
  };

  // Reset simulator
  const handleReset = () => {
    reset(() => {
      modelRef.current.clear();
      setQueueSnapshot(modelRef.current.getSnapshot());
      setP1(new Process({ id: 'P1', pid: 1042, name: 'P1 (Sender)', role: 'Writer Process', initialVars: { queued: 0 } }));
      setP2(new Process({ id: 'P2', pid: 2098, name: 'P2 (Receiver)', role: 'Worker Process', initialVars: { processed: 0 } }));
      setInFlightPacket(null);
    });
  };

  // Preset Scenario Loader
  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.messageQueues.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.capacity) {
      setCapacity(sc.params.capacity);
      modelRef.current.capacity = sc.params.capacity;
    }
    if (sc.params.mode) {
      setMode(sc.params.mode);
      modelRef.current.mode = sc.params.mode;
    }

    if (sc.id === 'mq-priority') {
      modelRef.current.enqueue({ content: 'Telemetry Ping', priority: 1, sender: 'P1' });
      modelRef.current.enqueue({ content: 'Periodic Log', priority: 2, sender: 'P1' });
      modelRef.current.enqueue({ content: 'CRITICAL SHUTDOWN ALERT', priority: 5, sender: 'P1' });
      setQueueSnapshot(modelRef.current.getSnapshot());
    }

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: 'mq_setattr()',
      kernelAction: `Configured queue capacity=${sc.params.capacity || 5}, mode=${sc.params.mode || 'FIFO'}`
    });
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    modelRef.current.mode = newMode;
    setQueueSnapshot(modelRef.current.getSnapshot());
  };

  const handleCapacityChange = (newCap) => {
    const val = Math.max(1, Math.min(10, Number(newCap)));
    setCapacity(val);
    modelRef.current.capacity = val;
    setQueueSnapshot(modelRef.current.getSnapshot());
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Simulation Controls Bar */}
      <SimulationControls
        isRunning={isRunning}
        onRun={run}
        onPause={pause}
        onStep={step}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        scenarios={SCENARIOS.messageQueues}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
        customControls={
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleModeChange(mode === 'FIFO' ? 'PRIORITY' : 'FIFO')}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-cyan-300 font-semibold transition-colors shadow-2xs"
            >
              Mode: {mode === 'FIFO' ? 'FIFO' : 'Priority'}
            </button>
          </div>
        }
      />

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Process Nodes & Animated Channel */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Row: Sender & Receiver Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={p1}
              isHighlighted={p1.state === PROCESS_STATES.RUNNING}
              roleLabel="Sender"
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isRunning}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              }
            />

            <ProcessNode
              process={p2}
              isHighlighted={p2.state === PROCESS_STATES.RUNNING}
              roleLabel="Receiver"
              extraDetails={
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => handleReceiveMessage()}
                    disabled={isRunning}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Receive</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Central Animated Message Queue Channel */}
          <CommunicationChannel
            title="Message Queue"
            channelType="queue"
            capacity={capacity}
            currentCount={queueSnapshot.length}
            isFull={queueSnapshot.length >= capacity}
            isEmpty={queueSnapshot.length === 0}
            inFlightPacket={inFlightPacket}
            customChildren={
              <div className="w-full space-y-2 my-2">
                <div className="flex items-center justify-between text-xs px-2 text-slate-500 dark:text-slate-400 font-medium">
                  <span>Front (Dequeue)</span>
                  <span>Back (Enqueue)</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto p-3 bg-slate-50 dark:bg-dark-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/80 min-h-[80px]">
                  {queueSnapshot.items.length === 0 ? (
                    <div className="w-full text-center text-xs text-slate-400 py-3 font-sans">
                      Queue is empty.
                    </div>
                  ) : (
                    queueSnapshot.items.map((msg, idx) => (
                      <motion.div
                        key={msg.id || idx}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={`shrink-0 p-3 rounded-xl border text-xs flex flex-col justify-between shadow-2xs min-w-[145px] transition-all ${
                          msg.priority >= 4
                            ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-500/50 dark:text-rose-200'
                            : msg.priority === 3
                            ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-500/50 dark:text-amber-200'
                            : 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-cyan-950/30 dark:border-cyan-500/50 dark:text-cyan-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400">
                            #{idx + 1} [{msg.id}]
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              msg.priority >= 4
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/30 dark:text-rose-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-cyan-500/30 dark:text-cyan-300'
                            }`}
                          >
                            Prio {msg.priority}
                          </span>
                        </div>
                        <div className="font-bold text-xs truncate text-slate-900 dark:text-white">
                          {msg.content}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                          <span>from {msg.sender}</span>
                          <span>{msg.createdAt}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            }
          />

          {/* Collapsible OS Explanation Panel */}
          <ExplanationPanel
            title={explanationInfo.title}
            concept={explanationInfo.concept}
            explanation={explanationInfo.explanation}
            syscall={explanationInfo.syscall}
            kernelAction={explanationInfo.kernelAction}
          />
        </div>

        {/* Right Column: Configuration & Event Timeline */}
        <div className="lg:col-span-4 space-y-4">
          {/* Message Composition & Queue Configuration Card */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-900/90 shadow-sm backdrop-blur-md space-y-3.5 text-xs transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Plus className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Compose Message
            </h4>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Message Content:</label>
              <input
                type="text"
                value={customMsgText}
                onChange={(e) => setCustomMsgText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs transition-all"
                placeholder="Enter payload string..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Priority (1-5):</label>
                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs cursor-pointer"
                >
                  <option value={1}>1 (Lowest)</option>
                  <option value={2}>2 (Low)</option>
                  <option value={3}>3 (Normal)</option>
                  <option value={4}>4 (High)</option>
                  <option value={5}>5 (Critical)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Queue Capacity:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={capacity}
                  onChange={(e) => handleCapacityChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs"
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Non-blocking Mode:</span>
              <button
                onClick={() => setIsNonBlocking(!isNonBlocking)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  isNonBlocking
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-dark-950 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {isNonBlocking ? 'ENABLED (IPC_NOWAIT)' : 'DISABLED (Wait/Block)'}
              </button>
            </div>
          </div>

          {/* Event Log & Execution Timeline */}
          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="message-queue"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};
