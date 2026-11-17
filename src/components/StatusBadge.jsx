import React from 'react';
import { PROCESS_STATES } from '../engine/processManager';

export const StatusBadge = ({ state = PROCESS_STATES.READY, size = 'sm' }) => {
  const styles = {
    [PROCESS_STATES.READY]: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    [PROCESS_STATES.RUNNING]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    [PROCESS_STATES.BLOCKED]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    [PROCESS_STATES.WAITING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    [PROCESS_STATES.TERMINATED]: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const dots = {
    [PROCESS_STATES.READY]: 'bg-sky-400',
    [PROCESS_STATES.RUNNING]: 'bg-emerald-400 animate-pulse',
    [PROCESS_STATES.BLOCKED]: 'bg-amber-400',
    [PROCESS_STATES.WAITING]: 'bg-yellow-400',
    [PROCESS_STATES.TERMINATED]: 'bg-rose-400',
  };

  const currentStyle = styles[state] || styles[PROCESS_STATES.READY];
  const dotStyle = dots[state] || dots[PROCESS_STATES.READY];

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : size === 'lg' 
    ? 'text-xs px-3 py-1 font-semibold' 
    : 'text-[11px] px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider ${sizeClasses} ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      {state}
    </span>
  );
};

