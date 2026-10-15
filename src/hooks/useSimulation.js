import { useState, useEffect, useRef, useCallback } from 'react';
import { EventLogger } from '../engine/eventLogger';

export const useSimulation = ({ onStepExecute, initialSpeed = 1 } = {}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [stepCount, setStepCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loggerRef = useRef(new EventLogger());
  const timerRef = useRef(null);

  // Subscribe to logger events
  useEffect(() => {
    const unsubscribe = loggerRef.current.subscribe((evts) => {
      setEvents(evts);
    });
    return () => unsubscribe();
  }, []);

  // Deterministic single step execution
  const executeStep = useCallback(() => {
    setStepCount((prev) => {
      const nextStep = prev + 1;
      if (onStepExecute) {
        onStepExecute(nextStep, loggerRef.current);
      }
      return nextStep;
    });
  }, [onStepExecute]);

  // Interval execution when isRunning is true
  useEffect(() => {
    if (isRunning) {
      const intervalMs = Math.max(250, 1500 / speed);
      timerRef.current = setInterval(() => {
        executeStep();
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, speed, executeStep]);

  const run = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((customResetLogic) => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStepCount(0);
    loggerRef.current.clear();
    setSelectedEvent(null);
    if (customResetLogic) {
      customResetLogic();
    }
  }, []);

  const clearLog = useCallback(() => {
    loggerRef.current.clear();
    setSelectedEvent(null);
  }, []);

  const logEvent = useCallback((eventData) => {
    return loggerRef.current.log(eventData);
  }, []);

  return {
    isRunning,
    speed,
    setSpeed,
    stepCount,
    events,
    selectedEvent,
    setSelectedEvent,
    run,
    pause,
    step: executeStep,
    reset,
    clearLog,
    logEvent,
    logger: loggerRef.current
  };
};
