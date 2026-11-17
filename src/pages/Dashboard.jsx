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
      name: 'Pipes',
      desc: 'Unidirectional stream between related processes.',
      icon: GitCommit,
      color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30'
    },
    {
      id: 'shared-memory',
      name: 'Shared Memory',
      desc: 'Direct RAM access with mutex synchronization.',
      icon: HardDrive,
      color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
    },
    {
      id: 'message-queues',
      name: 'Message Queues',
      desc: 'FIFO message packets with priority support.',
      icon: MessageSquare,
      color: 'bg-teal-50 dark:bg-cyan-500/10 text-teal-600 dark:text-cyan-400 border-teal-200 dark:border-cyan-500/30'
    },
    {
      id: 'sockets',
      name: 'Sockets',
      desc: 'Bidirectional client-server communication.',
      icon: Network,
      color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
    },
    {
      id: 'signals',
      name: 'Signals',
      desc: 'Asynchronous event notifications.',
      icon: Radio,
      color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
    },
    {
      id: 'named-pipes',
      name: 'Named Pipes',
      desc: 'Filesystem FIFO channel for unrelated processes.',
      icon: FileCode,
      color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            IPC Simulator
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 font-normal">
            Interactive visual simulations for operating system interprocess communication and synchronization.
          </p>

          <div className="flex items-center gap-2.5 pt-2 flex-wrap">
            <button
              onClick={() => onNavigate('pipes')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Simulator</span>
            </button>
            <button
              onClick={() => onNavigate('producer-consumer')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-500" />
              <span>Producer–Consumer</span>
            </button>
            <button
              onClick={() => onNavigate('tutorials')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>Tutorials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Live Producer-Consumer Mini Playground */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-5 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bounded Buffer Demo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click produce or consume to see buffer limits
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('producer-consumer')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <span>Full Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Mini Interactive Slots */}
        <div className="py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((slotIdx) => {
              const item = miniBuffer[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center text-xs transition-all ${
                    item
                      ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-dark-950 dark:border-slate-800'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">Slot {slotIdx}</span>
                  <span className="text-xs truncate px-1 font-semibold">{item ? 'Item' : '—'}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMiniProduce}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-xs"
            >
              + Produce
            </button>
            <button
              onClick={handleMiniConsume}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-xs"
            >
              - Consume
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
          {miniStatus}
        </div>
      </div>

      {/* IPC Mechanisms Catalog Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Mechanisms
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mechanisms.map((mech) => {
            const Icon = mech.icon;
            return (
              <div
                key={mech.id}
                onClick={() => onNavigate(mech.id)}
                className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-4 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`p-2 rounded-xl border ${mech.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-300 transition-colors">
                      {mech.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mech.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Progress & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-sky-600 dark:text-cyan-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Progress</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            {progress.visitedMechanisms?.length || 1} of 9 explored
          </div>
          <div className="w-full bg-slate-100 dark:bg-dark-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-sky-500 dark:bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((progress.visitedMechanisms?.length || 1) / 9) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Award className="w-4 h-4" />
            <span className="text-xs">Quiz</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Test your IPC and concurrency knowledge.
          </p>
          <button
            onClick={() => onNavigate('quiz')}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1"
          >
            <span>Start Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
            <Layers className="w-4 h-4" />
            <span className="text-xs">Comparison</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Compare performance, pros, and cons.
          </p>
          <button
            onClick={() => onNavigate('comparison')}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1"
          >
            <span>View Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
