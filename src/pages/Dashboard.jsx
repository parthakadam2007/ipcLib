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
  Play,
  Lightbulb,
  Zap
} from 'lucide-react';
import { getProgress, getRecentSimulations } from '../utils/storage';

export const Dashboard = ({ onNavigate }) => {
  const [progress] = useState(getProgress());
  const [recents] = useState(getRecentSimulations());

  // Interactive Mini Producer-Consumer Demonstration on Dashboard
  const [miniBuffer, setMiniBuffer] = useState(['Packet #1', 'Packet #2']);
  const [miniPointers, setMiniPointers] = useState({ in: 2, out: 0 });
  const [miniStatus, setMiniStatus] = useState('Buffer holds 2 items. Ready to produce or consume.');

  const handleMiniProduce = () => {
    if (miniBuffer.length >= 4) {
      setMiniStatus('Buffer is FULL (4/4)! Producer pauses so existing data is not overwritten.');
      return;
    }
    const newItem = `Packet #${(Date.now() % 90) + 10}`;
    setMiniBuffer([...miniBuffer, newItem]);
    setMiniPointers(prev => ({ ...prev, in: (prev.in + 1) % 4 }));
    setMiniStatus(`Produced ${newItem}. Buffer now has ${miniBuffer.length + 1}/4 items.`);
  };

  const handleMiniConsume = () => {
    if (miniBuffer.length === 0) {
      setMiniStatus('Buffer is EMPTY (0/4)! Consumer pauses waiting for new data.');
      return;
    }
    const consumed = miniBuffer[0];
    setMiniBuffer(miniBuffer.slice(1));
    setMiniPointers(prev => ({ ...prev, out: (prev.out + 1) % 4 }));
    setMiniStatus(`Consumed ${consumed}. Buffer now has ${miniBuffer.length - 1}/4 items.`);
  };

  const mechanisms = [
    {
      id: 'pipes',
      name: 'Anonymous Pipes',
      desc: 'Unidirectional stream connecting parent & child processes (like UNIX commands: ps | grep).',
      icon: GitCommit,
      category: 'Byte Stream',
      badge: 'Beginner',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30'
    },
    {
      id: 'shared-memory',
      name: 'Shared Memory',
      desc: 'Fastest IPC on a single computer. Direct RAM mapping with mutex lock protection against race conditions.',
      icon: HardDrive,
      category: 'Memory Sharing',
      badge: 'Essential',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
    },
    {
      id: 'message-queues',
      name: 'Message Queues',
      desc: 'Kernel-managed discrete packets with strict boundaries, FIFO order, and priority preemption.',
      icon: MessageSquare,
      category: 'Message Passing',
      badge: 'Popular',
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      color: 'bg-teal-50 dark:bg-cyan-500/10 text-teal-600 dark:text-cyan-400 border-teal-200 dark:border-cyan-500/30'
    },
    {
      id: 'sockets',
      name: 'Network & Local Sockets',
      desc: 'TCP 3-way handshake (SYN, SYN-ACK, ACK), bidirectional client-server request and response streams.',
      icon: Network,
      category: 'Networking',
      badge: 'Standard',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
    },
    {
      id: 'signals',
      name: 'Signals (POSIX)',
      desc: 'Asynchronous software interrupts (SIGINT, SIGTERM, SIGKILL) and custom user trap handlers.',
      icon: Radio,
      category: 'Notification',
      badge: 'Lifecycle',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
    },
    {
      id: 'named-pipes',
      name: 'Named Pipes (FIFOs)',
      desc: 'Filesystem-backed mkfifo channels enabling completely unrelated processes to rendezvous and talk.',
      icon: FileCode,
      category: 'Filesystem',
      badge: 'Unrelated IPC',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 dark:from-dark-900 dark:via-dark-850 dark:to-dark-900 border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors">
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/30 text-sky-700 dark:text-cyan-400 font-medium text-xs shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Computer Science Playground</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Interprocess Communication (IPC) Simulator Lab
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Understand how operating systems let isolated programs communicate, share RAM, and synchronize safely. Step through interactive visual labs showing pipes, message queues, race conditions, sockets, and deadlock prevention.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => onNavigate('message-queues')}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start with Message Queues</span>
            </button>
            <button
              onClick={() => onNavigate('producer-consumer')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-500" />
              <span>Producer–Consumer Lab</span>
            </button>
            <button
              onClick={() => onNavigate('tutorials')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
              <span>Guided Tutorials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Live Producer-Consumer Mini Playground */}
      <div className="rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-dark-900 dark:to-amber-950/20 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-3.5 border-b border-amber-100 dark:border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-2xs">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  Quick Interactive Demo: Bounded Buffer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Try it here
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click produce or consume to see buffer limits and process coordination in action
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('producer-consumer')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 bg-amber-100/60 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 transition-colors"
          >
            <span>Open Dedicated Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Mini Interactive Slots */}
        <div className="py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            {[0, 1, 2, 3].map((slotIdx) => {
              const item = miniBuffer[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center text-xs transition-all ${
                    item
                      ? 'bg-amber-100/80 border-amber-300 text-amber-900 dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-dark-950/80 dark:border-slate-800 dark:text-slate-600'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-medium">Slot {slotIdx}</span>
                  <span className="text-xs truncate px-1 font-semibold">{item || 'Empty'}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleMiniProduce}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 active:scale-95"
            >
              + Produce Packet
            </button>
            <button
              onClick={handleMiniConsume}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              - Consume Packet
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span><strong>Status:</strong> {miniStatus}</span>
        </div>
      </div>

      {/* IPC Mechanisms Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Explore IPC Mechanisms
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            6 Specialized Simulation Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mechanisms.map((mech) => {
            const Icon = mech.icon;
            return (
              <div
                key={mech.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 p-5 shadow-2xs hover:shadow-md hover:border-sky-300 dark:hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${mech.color} shadow-2xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${mech.badgeColor}`}>
                      {mech.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-300 transition-colors">
                    {mech.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {mech.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">{mech.category}</span>
                  <button
                    onClick={() => onNavigate(mech.id)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
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
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-sky-600 dark:text-cyan-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Learning Progress</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 text-xs">
            {progress.visitedMechanisms?.length || 1} of 9 simulations explored
          </div>
          <div className="w-full bg-slate-100 dark:bg-dark-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-sky-500 dark:bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((progress.visitedMechanisms?.length || 1) / 9) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Award className="w-4 h-4" />
            <span className="text-sm">Interactive Quiz</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Test your knowledge with 15+ student-friendly OS questions across all topics.
          </p>
          <button
            onClick={() => onNavigate('quiz')}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1"
          >
            <span>Take the Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900/90 text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
            <Layers className="w-4 h-4" />
            <span className="text-sm">Mechanism Comparison</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Side-by-side comparison of Shared Memory vs. Message Passing with pros and cons.
          </p>
          <button
            onClick={() => onNavigate('comparison')}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1"
          >
            <span>View Comparison Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
