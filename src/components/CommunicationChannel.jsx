import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, Database, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const CommunicationChannel = ({
  title = 'Communication Channel',
  channelType = 'pipe', // 'pipe' | 'queue' | 'shared-memory' | 'socket' | 'fifo' | 'signal'
  capacity = 5,
  currentCount = 0,
  slots = [],
  inFlightPacket = null,
  direction = 'left-to-right',
  statusMessage = null,
  isFull = false,
  isEmpty = false,
  customChildren = null
}) => {
  const percentOccupied = capacity > 0 ? Math.min(100, Math.round((currentCount / capacity) * 100)) : 0;

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-dark-900/90 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between my-3 transition-colors">
      {/* Channel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-cyan-500/10 border border-sky-200 dark:border-cyan-500/30 text-sky-600 dark:text-cyan-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h4>
        </div>

        {/* Capacity Meter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`${isFull ? 'text-amber-600 dark:text-amber-400 font-bold' : isEmpty ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {currentCount} / {capacity}
          </span>
          <div className="w-16 h-2 bg-slate-100 dark:bg-dark-950 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isFull ? 'bg-amber-500' : percentOccupied > 75 ? 'bg-amber-400' : 'bg-sky-500'
              }`}
              style={{ width: `${percentOccupied}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Channel Visual Stream */}
      <div className="py-4 relative flex flex-col items-center justify-center min-h-[90px]">
        {/* Animated Background Flow Line */}
        <div className="w-full h-2 bg-slate-100 dark:bg-dark-950 rounded-full border border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden my-2">
          <motion.div
            animate={{ x: direction === 'right-to-left' ? ['100%', '-100%'] : ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
            className="w-1/3 h-full bg-gradient-to-r from-transparent via-sky-500 dark:via-cyan-400 to-transparent opacity-80"
          />
        </div>

        {/* In-Flight Packet Animation */}
        <AnimatePresence>
          {inFlightPacket && (
            <motion.div
              initial={{ x: direction === 'right-to-left' ? 140 : -140, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: direction === 'right-to-left' ? -140 : 140, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="absolute z-20 px-3.5 py-1.5 rounded-xl bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-mono text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5 border border-sky-400 dark:border-cyan-300"
            >
              <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              <span>{typeof inFlightPacket === 'object' ? inFlightPacket.payload || inFlightPacket.content || 'Data' : inFlightPacket}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Slot Rendering (if provided) */}
        {customChildren ? (
          <div className="w-full">{customChildren}</div>
        ) : (
          /* Buffer Slots Visualization */
          <div className="w-full flex items-center justify-center gap-2 flex-wrap my-2">
            {Array.from({ length: Math.min(capacity, 10) }).map((_, idx) => {
              const item = slots[idx];
              const isOccupied = Boolean(item);

              return (
                <div
                  key={idx}
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-mono text-xs border transition-all ${
                    isOccupied
                      ? 'bg-sky-50 dark:bg-cyan-500/20 border-sky-300 dark:border-cyan-400/70 text-sky-800 dark:text-cyan-300 font-bold shadow-2xs'
                      : 'bg-slate-50 dark:bg-dark-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                  title={isOccupied ? `Slot ${idx}: ${JSON.stringify(item)}` : `Slot ${idx} (Empty)`}
                >
                  <span className="text-[9px] absolute top-1 left-1.5 text-slate-400">
                    {idx}
                  </span>
                  {isOccupied ? (
                    <span className="truncate px-1 text-[11px]">
                      {typeof item === 'object' ? (item.val || item.content || item.id || '■') : item}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Channel Footer & Status Badges */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-2">
          {isFull && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> BUFFER FULL
            </span>
          )}
          {isEmpty && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 font-medium">
              BUFFER EMPTY
            </span>
          )}
          {statusMessage && (
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs">{statusMessage}</span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Flow: <span className="text-sky-600 dark:text-cyan-400 font-semibold">{direction === 'right-to-left' ? '← P2 to P1' : 'P1 to P2 →'}</span>
        </div>
      </div>
    </div>
  );
};
