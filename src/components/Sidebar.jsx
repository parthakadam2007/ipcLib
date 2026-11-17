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
  Menu,
  X,
  Flame
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },

  { id: 'pipes', name: 'Anonymous Pipes', icon: GitCommit, category: 'IPC Mechanisms' },
  { id: 'shared-memory', name: 'Shared Memory', icon: HardDrive, category: 'IPC Mechanisms' },
  { id: 'message-queues', name: 'Message Queues', icon: MessageSquare, category: 'IPC Mechanisms' },
  { id: 'sockets', name: 'Sockets (TCP/IP)', icon: Network, category: 'IPC Mechanisms' },
  { id: 'signals', name: 'Signals (POSIX)', icon: Radio, category: 'IPC Mechanisms' },
  { id: 'named-pipes', name: 'Named Pipes (FIFO)', icon: FileCode, category: 'IPC Mechanisms' },

  { id: 'producer-consumer', name: 'Producer–Consumer', icon: Repeat, category: 'Advanced Labs', badge: 'Featured' },
  { id: 'deadlock', name: 'Deadlock & Concurrency', icon: ShieldAlert, category: 'Advanced Labs' },

  { id: 'comparison', name: 'Mechanism Matrix', icon: GitCompare, category: 'Learning' },
  { id: 'tutorials', name: 'Guided Tutorials', icon: GraduationCap, category: 'Learning' },
  { id: 'quiz', name: 'Knowledge Quiz', icon: HelpCircle, category: 'Learning' },
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-dark-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <span className="font-bold text-sm text-white">Menu Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {categories.map((cat) => {
            const items = NAV_ITEMS.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1.5">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> {item.badge}
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
        <div className="p-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 bg-dark-950/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 font-semibold">Mode</span>
            <span className="text-emerald-400 font-bold">Deterministic</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Step-by-step operating system semantics & interactive visualizations.
          </p>
        </div>
      </aside>
    </>
  );
};

