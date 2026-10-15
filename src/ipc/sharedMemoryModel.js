// Shared Memory IPC Model
// Simulates shmget/shmat memory region, mutex locking, and race conditions

export class SharedMemoryModel {
  constructor({ baseAddress = '0x7FFE0400', initialData = {} } = {}) {
    this.baseAddress = baseAddress;
    this.memory = {
      counter: 10,
      status: 'IDLE',
      lastUpdatedBy: 'INIT',
      ...initialData
    };
    this.mutex = {
      locked: false,
      holder: null,
      waitingQueue: []
    };
    this.history = [];
    this.raceConditionDetected = false;
  }

  // Mutex operations
  acquireMutex(processId) {
    if (!this.mutex.locked) {
      this.mutex.locked = true;
      this.mutex.holder = processId;
      return { success: true, acquired: true };
    }

    if (this.mutex.holder === processId) {
      return { success: true, acquired: true, note: 'Re-entrant lock' };
    }

    if (!this.mutex.waitingQueue.includes(processId)) {
      this.mutex.waitingQueue.push(processId);
    }
    return { success: false, acquired: false, error: `Mutex held by ${this.mutex.holder}. ${processId} is blocked.` };
  }

  releaseMutex(processId) {
    if (!this.mutex.locked) {
      return { success: false, error: 'Mutex was not locked.' };
    }
    if (this.mutex.holder !== processId) {
      return { success: false, error: `Process ${processId} cannot unlock mutex held by ${this.mutex.holder}` };
    }

    this.mutex.locked = false;
    this.mutex.holder = null;

    let unblocked = null;
    if (this.mutex.waitingQueue.length > 0) {
      unblocked = this.mutex.waitingQueue.shift();
      this.mutex.locked = true;
      this.mutex.holder = unblocked;
    }

    return { success: true, unblocked };
  }

  // Memory operations
  read(key) {
    return this.memory[key];
  }

  write(key, value, processId, synchronized = false) {
    const oldValue = this.memory[key];

    // If synchronized is required but mutex is not held by caller
    if (synchronized && this.mutex.holder !== processId) {
      return {
        success: false,
        error: `Access violation: Process ${processId} attempted write without acquiring mutex lock!`
      };
    }

    this.memory[key] = value;
    this.memory.lastUpdatedBy = processId;

    this.history.push({
      timestamp: new Date().toLocaleTimeString(),
      process: processId,
      key,
      oldValue,
      newValue: value,
      synchronized
    });

    return {
      success: true,
      key,
      oldValue,
      newValue: value,
      synchronized
    };
  }

  reset() {
    this.memory = {
      counter: 10,
      status: 'IDLE',
      lastUpdatedBy: 'INIT'
    };
    this.mutex = {
      locked: false,
      holder: null,
      waitingQueue: []
    };
    this.history = [];
    this.raceConditionDetected = false;
  }

  getSnapshot() {
    return {
      baseAddress: this.baseAddress,
      memory: { ...this.memory },
      mutex: {
        locked: this.mutex.locked,
        holder: this.mutex.holder,
        waitingCount: this.mutex.waitingQueue.length,
        waitingQueue: [...this.mutex.waitingQueue]
      },
      history: [...this.history],
      raceConditionDetected: this.raceConditionDetected
    };
  }
}
