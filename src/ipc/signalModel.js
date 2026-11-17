// Signal IPC Model: Simulates asynchronous software interrupts / UNIX signals

export const SIGNALS = {
  SIGINT: { number: 2, name: 'SIGINT', desc: 'Interrupt from keyboard (Ctrl+C)', catchable: true, defaultAction: 'terminate' },
  SIGQUIT: { number: 3, name: 'SIGQUIT', desc: 'Quit from keyboard (core dump)', catchable: true, defaultAction: 'terminate' },
  SIGKILL: { number: 9, name: 'SIGKILL', desc: 'Kill signal (Uncatchable, cannot be ignored)', catchable: false, defaultAction: 'kill' },
  SIGUSR1: { number: 10, name: 'SIGUSR1', desc: 'User-defined signal 1 (Custom handler)', catchable: true, defaultAction: 'custom' },
  SIGUSR2: { number: 12, name: 'SIGUSR2', desc: 'User-defined signal 2 (Custom handler)', catchable: true, defaultAction: 'custom' },
  SIGTERM: { number: 15, name: 'SIGTERM', desc: 'Termination signal (Graceful exit request)', catchable: true, defaultAction: 'terminate' },
  SIGSTOP: { number: 19, name: 'SIGSTOP', desc: 'Stop process execution (Uncatchable)', catchable: false, defaultAction: 'stop' },
  SIGCONT: { number: 18, name: 'SIGCONT', desc: 'Continue process if stopped', catchable: true, defaultAction: 'continue' }
};

export class SignalModel {
  constructor() {
    this.signalHandlers = {
      SIGINT: 'default', // 'default' | 'ignore' | 'custom'
      SIGTERM: 'default',
      SIGUSR1: 'custom',
      SIGUSR2: 'custom',
      SIGCONT: 'default'
      // Note: SIGKILL and SIGSTOP handlers CANNOT be changed by OS design!
    };
    this.pendingSignals = [];
    this.lastDispatched = null;
    this.handlerLogs = [];
  }

  setHandler(signalName, mode) {
    if (signalName === 'SIGKILL' || signalName === 'SIGSTOP') {
      return { success: false, error: `${signalName} cannot be caught, blocked, or ignored by POSIX standard.` };
    }
    this.signalHandlers[signalName] = mode;
    return { success: true, signal: signalName, mode };
  }

  dispatch(signalKey, senderPid, receiverProcess) {
    const sig = SIGNALS[signalKey];
    if (!sig) return { success: false, error: 'Unknown signal' };

    const action = sig.catchable ? (this.signalHandlers[signalKey] || sig.defaultAction) : sig.defaultAction;
    
    const event = {
      id: `sig-${Date.now()}`,
      signal: sig,
      senderPid,
      receiverPid: receiverProcess.pid,
      timestamp: new Date().toLocaleTimeString(),
      handlerType: action
    };

    this.lastDispatched = event;

    // Apply outcome to receiver process
    let outcome = '';
    let newState = receiverProcess.state;

    if (action === 'kill' || (action === 'terminate' && this.signalHandlers[signalKey] !== 'ignore')) {
      newState = 'TERMINATED';
      outcome = `Process ${receiverProcess.pid} received ${sig.name} and was terminated.`;
    } else if (action === 'stop') {
      newState = 'BLOCKED';
      outcome = `Process ${receiverProcess.pid} suspended by kernel via ${sig.name}.`;
    } else if (action === 'continue') {
      newState = 'READY';
      outcome = `Process ${receiverProcess.pid} resumed by kernel via ${sig.name}.`;
    } else if (action === 'ignore') {
      outcome = `Process ${receiverProcess.pid} ignored signal ${sig.name} (SIG_IGN registered).`;
    } else {
      // Custom handler
      outcome = `Process ${receiverProcess.pid} intercepted ${sig.name} and executed custom user handler!`;
    }

    this.handlerLogs.push({
      signal: sig.name,
      outcome,
      timestamp: event.timestamp
    });

    return {
      success: true,
      event,
      action,
      newState,
      outcome
    };
  }

  clear() {
    this.pendingSignals = [];
    this.lastDispatched = null;
    this.handlerLogs = [];
  }

  getSnapshot() {
    return {
      handlers: { ...this.signalHandlers },
      pending: [...this.pendingSignals],
      lastDispatched: this.lastDispatched,
      logCount: this.handlerLogs.length
    };
  }
}

