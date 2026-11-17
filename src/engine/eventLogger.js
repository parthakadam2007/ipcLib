// Event Logger for tracking detailed simulation steps

export class EventLogger {
  constructor() {
    this.events = [];
    this.subscribers = new Set();
  }

  log({ step, process, operation, details, data = null, stateChange = null, status = 'success' }) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      step,
      timestamp: new Date().toLocaleTimeString(),
      process,
      operation,
      details,
      data,
      stateChange,
      status, // 'success' | 'waiting' | 'error' | 'info'
    };

    this.events.unshift(event); // newest on top for immediate display
    this.notify();
    return event;
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const callback of this.subscribers) {
      callback([...this.events]);
    }
  }
}

