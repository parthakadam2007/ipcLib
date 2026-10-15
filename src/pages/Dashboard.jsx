import React, { useState } from 'react';
import {
  Cpu,
  GitCommit,
  HardDrive,
  MessageSquare,
  Network,
  Radio,
  FileCode,
  Repeat,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';
import { getProgress, getRecentSimulations } from '../utils/storage';

export const Dashboard = ({ onNavigate }) => {
  const [progress] = useState(getProgress());
  const [recents] = useState(getRecentSimulations());

  // Interactive Mini Producer-Consumer Demonstration on Dashboard
  const [miniBuffer, setMiniBuffer] = useState(['Item #1', 'Item #2']);
  const [miniPointers, setMiniPointers] = useState({ in: 2, out: 0 });
  const [miniStatus, setMiniStatus] = useState('Buffer holds 2 items. Ready to produce or consume.');

  const handleMiniProduce = () => {
    if (miniBuffer.length >= 4) {
      setMiniStatus('Buffer is FULL (4/4)! sem_wait(&empty) blocks producer.');
      return;
    }
    const newItem = `Item #${Date.now() % 100}`;
    setMiniBuffer([...miniBuffer, newItem]);
    setMiniPointers(prev => ({ ...prev, in: (prev.in + 1) % 4 }));
    setMiniStatus(`Producer produced ${newItem}. sem_post(&full) incremented.`);
  };

  const handleMiniConsume = () => {
    if (miniBuffer.length === 0) {
      setMiniStatus('Buffer is EMPTY (0/4)! sem_wait(&full) blocks consumer.');
      return;
    }
    const consumed = miniBuffer[0];
    setMiniBuffer(miniBuffer.slice(1));
    setMiniPointers(prev => ({ ...prev, out: (prev.out + 1) % 4 }));
    setMiniStatus(`Consumer consumed ${consumed}. sem_post(&empty) incremented.`);
  };

  const mechanisms = [
    {
      id: 'pipes',
      name: 'Anonymous Pipes',
      desc: 'Unidirectional byte streams connecting related parent and child processes via fd[0] and fd[1].',
      icon: GitCommit,
      category: 'Stream IPC',
      color: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30'
    },
    {
      id: 'shared-memory',
      name: 'Shared Memory',
      desc: 'Zero-copy direct RAM frame mapping between processes with mutex-based race condition prevention.',
      icon: HardDrive,
      category: 'Memory Sharing',
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'message-queues',
      name: 'Message Queues',
      desc: 'Discrete kernel messages with strict message boundaries, FIFO ordering, and priority dispatch.',
      icon: MessageSquare,
      category: 'Message Passing',
      color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'sockets',
      name: 'Network & Local Sockets',
      desc: 'TCP 3-way handshake (SYN, SYN-ACK, ACK), bidirectional client-server request/response streaming.',
      icon: Network,
      category: 'Networking',
      color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'signals',
      name: 'Signals (POSIX)',
      desc: 'Asynchronous software interrupts (SIGINT, SIGTERM, SIGKILL, SIGSTOP) and signal trap handlers.',
      icon: Radio,
      category: 'Notification',
      color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'named-pipes',
      name: 'Named Pipes (FIFOs)',
      desc: 'Filesystem-backed mkfifo channels enabling unrelated processes to rendezvous and stream data.',
      icon: FileCode,
      category: 'Filesystem IPC',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Computer Science Laboratory</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Interprocess Communication (IPC) Simulator Lab
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Interprocess Communication (IPC) refers to the OS kernel mechanisms and protocols that allow concurrent, isolated processes to share memory, exchange messages, and synchronize execution. Explore realistic simulations of POSIX pipes, shared memory regions, priority message queues, network sockets, signals, and deadlock avoidance.
          </p>

          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <button
              onClick={() => onNavigate('message-queues')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg glow-cyan flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Message Queues</span>
            </button>
            <button
              onClick={() => onNavigate('producer-consumer')}
              className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all flex items-center gap-2"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-400" />
              <span>Producer–Consumer Lab</span>
            </button>
            <button
              onClick={() => onNavigate('tutorials')}
              className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all flex items-center gap-2"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guided Tutorials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Producer-Consumer Demonstration Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-dark-900 to-amber-950/20 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Featured Demonstration: Bounded Buffer Producer–Consumer
              </h3>
              <p className="text-xs text-slate-400">
                Interactive Dijkstra semaphore demonstration running live on the dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('producer-consumer')}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <span>Open Dedicated Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Mini Interactive Slots */}
        <div className="py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((slotIdx) => {
              const item = miniBuffer[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center font-mono text-xs transition-all ${
                    item
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                      : 'bg-dark-950/80 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] text-slate-500">Slot {slotIdx}</span>
                  <span className="text-[11px] truncate px-1">{item || 'Empty'}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMiniProduce}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan"
            >
              + Produce
            </button>
            <button
              onClick={handleMiniConsume}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green"
            >
              - Consume
            </button>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-dark-950 border border-slate-800 text-xs font-mono text-slate-300">
          ↳ <span className="text-amber-300 font-bold">Status:</span> {miniStatus}
        </div>
      </div>

      {/* IPC Mechanisms Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Core IPC Mechanism Simulations
          </h2>
          <span className="text-xs font-mono text-slate-400">
            6 Specialized Simulation Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanisms.map((mech) => {
            const Icon = mech.icon;
            return (
              <div
                key={mech.id}
                className="group relative rounded-2xl border border-slate-800/90 bg-dark-900/90 p-5 shadow-lg backdrop-blur-md hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl border bg-gradient-to-br ${mech.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                      {mech.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                    {mech.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {mech.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate(mech.id)}
                    className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Launch Simulator</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Progress & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-dark-900/90 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Learning Modules</span>
          </div>
          <div className="text-slate-300">
            {progress.visitedMechanisms?.length || 1} of 9 simulations visited
          </div>
          <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full"
              style={{ width: `${Math.round(((progress.visitedMechanisms?.length || 1) / 9) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-dark-900/90 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Award className="w-4 h-4" />
            <span>Interactive Assessment</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Test your knowledge across 15+ comprehensive OS questions.
          </p>
          <button
            onClick={() => onNavigate('quiz')}
            className="text-emerald-400 hover:text-emerald-300 font-bold block pt-1"
          >
            Start Knowledge Quiz →
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-dark-900/90 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Layers className="w-4 h-4" />
            <span>Architectural Matrix</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Deep side-by-side comparison of Shared Memory vs Message Passing.
          </p>
          <button
            onClick={() => onNavigate('comparison')}
            className="text-purple-400 hover:text-purple-300 font-bold block pt-1"
          >
            View Comparison Matrix →
          </button>
        </div>
      </div>
    </div>
  );
};
