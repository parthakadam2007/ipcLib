// Process Manager: handles process state machines and attributes

export const PROCESS_STATES = {
  READY: 'READY',
  RUNNING: 'RUNNING',
  BLOCKED: 'BLOCKED',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED',
};

export const PROCESS_STATE_COLORS = {
  [PROCESS_STATES.READY]: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/40',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    glow: 'rgba(56, 189, 248, 0.4)',
  },
  [PROCESS_STATES.RUNNING]: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glow: 'rgba(34, 197, 94, 0.5)',
  },
  [PROCESS_STATES.BLOCKED]: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  [PROCESS_STATES.WAITING]: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    glow: 'rgba(234, 179, 8, 0.4)',
  },
  [PROCESS_STATES.TERMINATED]: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
};

export class Process {
  constructor({ id, pid, name, role = 'worker', initialState = PROCESS_STATES.READY, initialVars = {} }) {
    this.id = id;
    this.pid = pid || Math.floor(1000 + Math.random() * 9000);
    this.name = name;
    this.role = role;
    this.state = initialState;
    this.currentOperation = 'Idle';
    this.localVariables = { ...initialVars };
    this.messagesSent = [];
    this.messagesReceived = [];
    this.blockedReason = null;
    this.cpuTime = 0;
  }

  transitionTo(nextState, operation = '', blockedReason = null) {
    const prevState = this.state;
    this.state = nextState;
    this.currentOperation = operation || this.currentOperation;
    this.blockedReason = blockedReason;
    return { from: prevState, to: nextState };
  }

  setOperation(op) {
    this.currentOperation = op;
  }

  setVariable(key, val) {
    this.localVariables[key] = val;
  }

  recordSent(msg) {
    this.messagesSent.push(msg);
  }

  recordReceived(msg) {
    this.messagesReceived.push(msg);
  }

  clone() {
    const p = new Process({
      id: this.id,
      pid: this.pid,
      name: this.name,
      role: this.role,
      initialState: this.state,
      initialVars: { ...this.localVariables },
    });
    p.currentOperation = this.currentOperation;
    p.messagesSent = [...this.messagesSent];
    p.messagesReceived = [...this.messagesReceived];
    p.blockedReason = this.blockedReason;
    p.cpuTime = this.cpuTime;
    return p;
  }
}
