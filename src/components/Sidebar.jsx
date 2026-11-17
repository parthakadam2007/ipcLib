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
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },

  { id: 'pipes', name: 'Pipes', icon: GitCommit, category: 'IPC Mechanisms' },
  { id: 'shared-memory', name: 'Shared Memory', icon: HardDrive, category: 'IPC Mechanisms' },
  { id: 'message-queues', name: 'Message Queues', icon: MessageSquare, category: 'IPC Mechanisms' },
  { id: 'sockets', name: 'Sockets', icon: Network, category: 'IPC Mechanisms' },
  { id: 'signals', name: 'Signals', icon: Radio, category: 'IPC Mechanisms' },
  { id: 'named-pipes', name: 'Named Pipes', icon: FileCode, category: 'IPC Mechanisms' },

  { id: 'producer-consumer', name: 'Producer–Consumer', icon: Repeat, category: 'Advanced Labs' },
  { id: 'deadlock', name: 'Deadlock', icon: ShieldAlert, category: 'Advanced Labs' },

  { id: 'comparison', name: 'Comparison', icon: GitCompare, category: 'Learning' },
  { id: 'tutorials', name: 'Tutorials', icon: GraduationCap, category: 'Learning' },
  { id: 'quiz', name: 'Quiz', icon: HelpCircle, category: 'Learning' },
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-60 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 shadow-lg lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <span className="font-bold text-sm text-slate-800 dark:text-white">Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {categories.map((cat) => {
            const items = NAV_ITEMS.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-0.5">
                <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
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
                      className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/40 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-dark-850'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
