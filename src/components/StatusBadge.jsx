import React from 'react';
import { PROCESS_STATES } from '../engine/processManager';

export const StatusBadge = ({ state = PROCESS_STATES.READY, size = 'sm' }) => {
  const styles = {
    [PROCESS_STATES.READY]: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
    [PROCESS_STATES.RUNNING]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
    [PROCESS_STATES.BLOCKED]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    [PROCESS_STATES.WAITING]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
    [PROCESS_STATES.TERMINATED]: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
  };

  const dots = {
    [PROCESS_STATES.READY]: 'bg-sky-500',
    [PROCESS_STATES.RUNNING]: 'bg-emerald-500 animate-pulse',
    [PROCESS_STATES.BLOCKED]: 'bg-amber-500',
    [PROCESS_STATES.WAITING]: 'bg-yellow-500',
    [PROCESS_STATES.TERMINATED]: 'bg-rose-500',
  };

  const currentStyle = styles[state] || styles[PROCESS_STATES.READY];
  const dotStyle = dots[state] || dots[PROCESS_STATES.READY];

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-xs px-3 py-1 font-semibold' 
    : 'text-[11px] px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium uppercase tracking-wider shadow-2xs ${sizeClasses} ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      {state}
    </span>
  );
};
