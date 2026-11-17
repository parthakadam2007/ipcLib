import React from 'react';
import {
  LayoutDashboard,
  GitCommit,
  HardDrive,
  MessageSquare,
  Network,
  Radio,
  FileCode,
  Repeat,
  ShieldAlert,
  GitCompare,
  GraduationCap,
  HelpCircle,
  X,
  Flame,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, category: 'Overview', desc: 'Home & Featured Labs' },

  { id: 'pipes', name: 'Anonymous Pipes', icon: GitCommit, category: 'IPC Mechanisms', desc: 'Stream via fd[0]/fd[1]' },
  { id: 'shared-memory', name: 'Shared Memory', icon: HardDrive, category: 'IPC Mechanisms', desc: 'RAM Mapping & Mutex' },
  { id: 'message-queues', name: 'Message Queues', icon: MessageSquare, category: 'IPC Mechanisms', desc: 'FIFO & Priority Packets' },
  { id: 'sockets', name: 'Sockets (TCP/IP)', icon: Network, category: 'IPC Mechanisms', desc: '3-Way Handshake & Streams' },
  { id: 'signals', name: 'Signals (POSIX)', icon: Radio, category: 'IPC Mechanisms', desc: 'Interrupts & Traps' },
  { id: 'named-pipes', name: 'Named Pipes (FIFO)', icon: FileCode, category: 'IPC Mechanisms', desc: 'Filesystem mkfifo()' },

  { id: 'producer-consumer', name: 'Producer–Consumer', icon: Repeat, category: 'Advanced Labs', badge: 'Popular', desc: 'Bounded buffer semaphores' },
  { id: 'deadlock', name: 'Deadlock & Concurrency', icon: ShieldAlert, category: 'Advanced Labs', desc: 'RAG & Coffman conditions' },

  { id: 'comparison', name: 'Mechanism Matrix', icon: GitCompare, category: 'Learning', desc: 'Pros, cons & tradeoffs' },
  { id: 'tutorials', name: 'Guided Tutorials', icon: GraduationCap, category: 'Learning', desc: 'Step-by-step guides' },
  { id: 'quiz', name: 'Knowledge Quiz', icon: HelpCircle, category: 'Learning', desc: 'Test OS understanding' },
];

export const Sidebar = ({
  activePage = 'dashboard',
  onNavigate,
  isMobileOpen = false,
  onCloseMobile = () => {}
}) => {
  const categories = ['Overview', 'IPC Mechanisms', 'Advanced Labs', 'Learning'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 shadow-lg lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
              IPC
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-white">Navigation</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-6">
          {categories.map((cat) => {
            const items = NAV_ITEMS.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {cat}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200 shadow-2xs dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/40'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-dark-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-sky-500 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-2xs'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800 dark:bg-dark-850 dark:text-slate-400 dark:group-hover:bg-dark-800 dark:group-hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="text-left truncate">
                          <span className="block truncate text-xs font-semibold">{item.name}</span>
                          <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-0.5 shadow-2xs">
                          <Flame className="w-2.5 h-2.5 fill-amber-500" /> {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info card */}
        <div className="p-3.5 m-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950/60 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px]">
              Active
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Deterministic Lab</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Every step executes true OS logic. Click <strong className="text-slate-700 dark:text-slate-200">Step</strong> to advance one micro-operation.
          </p>
        </div>
      </aside>
    </>
  );
};
