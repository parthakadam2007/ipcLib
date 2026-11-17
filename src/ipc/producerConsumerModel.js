// Producer-Consumer Bounded Buffer IPC Model
// Imulates classic Dijkstra semaphores: empty (counting), full (counting), mutex (binary)
// Also supports 'NONE' mode to showcase race conditions & buffer corruption

export class ProducerConsumerModel {
  constructor({ capacity = 5, syncMode = 'SEMAPHORES' } = {}) {
    this.capacity = capacity;
    this.syncMode = syncMode; // 'SEMAPHORES' | 'MUTEX_ONLY' | 'NONE'
    
    // Circular buffer
    this.slots = new Array(capacity).fill(null);
    this.inIndex = 0;
    this.outIndex = 0;
    this.count = 0;

    // Semaphores
    this.semaphores = {
      empty: capacity, // counts free slots
      full: 0,         // counts occupied slots
      mutex: 1         // binary semaphore for critical section
    };

    this.producedCount = 0;
    this.consumedCount = 0;
    this.raceConditionDetected = false;
    this.raceMessage = null;
  }

  setCapacity(newCapacity) {
    this.capacity = newCapacity;
    this.reset();
  }

  setSyncMode(mode) {
    this.syncMode = mode;
  }

  produce(itemValue) {
    const item = {
      id: ++this.producedCount,
      val: itemValue || `D${this.producedCount}`,
      timestamp: new Date().toLocaleTimeString(),
      slot: this.inIndex
    };

    if (this.syncMode === 'SEMAPHORES') {
      // Check semaphores
      if (this.semaphores.empty <= 0) {
        return {
          success: false,
          blocked: true,
          reason: 'Producer BLOCKED: sem_wait(&empty) <= 0. Buffer is FULL!'
        };
      }
      if (this.semaphores.mutex <= 0) {
        return {
          success: false,
          blocked: true,
          reason: 'Producer BLOCKED: sem_wait(&mutex) <= 0. Consumer holds buffer mutex.'
        };
      }

      // Decrement semaphores
      this.semaphores.empty--;
      this.semaphores.mutex = 0;

      // Critical section: write item
      this.slots[this.inIndex] = item;
      const targetSlot = this.inIndex;
      this.inIndex = (this.inIndex + 1) % this.capacity;
      this.count++;

      // Unlock mutex and increment full
      this.semaphores.mutex = 1;
      this.semaphores.full++;

      return {
        success: true,
        item,
        slot: targetSlot,
        blocked: false
      };
    } else if (this.syncMode === 'MUTEX_ONLY') {
      // Mutex prevents concurrent write, but without counting semaphores, buffer overflow can occur!
      if (this.semaphores.mutex <= 0) {
        return { success: false, blocked: true, reason: 'Blocked by mutex' };
      }
      this.semaphores.mutex = 0;

      if (this.count >= this.capacity) {
        this.raceConditionDetected = true;
        this.raceMessage = `Buffer OVERFLOW! Producer wrote to full buffer without empty slot coordination!`;
      }

      this.slots[this.inIndex] = item;
      const targetSlot = this.inIndex;
      this.inIndex = (this.inIndex + 1) % this.capacity;
      this.count = Math.min(this.count + 1, this.capacity);
      this.semaphores.mutex = 1;

      return {
        success: true,
        item,
        slot: targetSlot,
        blocked: false,
        warning: this.raceConditionDetected ? this.raceMessage : null
      };
    } else {
      // NONE (Unsynchronized race condition)
      if (this.count >= this.capacity) {
        this.raceConditionDetected = true;
        this.raceMessage = `RACE CONDITION: Producer overwritten unread slot ${this.inIndex} (Buffer Overflow)!`;
      }
      this.slots[this.inIndex] = item;
      const targetSlot = this.inIndex;
      this.inIndex = (this.inIndex + 1) % this.capacity;
      this.count++;

      return {
        success: true,
        item,
        slot: targetSlot,
        blocked: false,
        race: this.raceConditionDetected
      };
    }
  }

  consume() {
    if (this.syncMode === 'SEMAPHORES') {
      if (this.semaphores.full <= 0) {
        return {
          success: false,
          blocked: true,
          reason: 'Consumer BLOCKED: sem_wait(&full) <= 0. Buffer is EMPTY!'
        };
      }
      if (this.semaphores.mutex <= 0) {
        return {
          success: false,
          blocked: true,
          reason: 'Consumer BLOCKED: sem_wait(&mutex) <= 0. Producer holds buffer mutex.'
        };
      }

      this.semaphores.full--;
      this.semaphores.mutex = 0;

      const item = this.slots[this.outIndex];
      this.slots[this.outIndex] = null;
      const targetSlot = this.outIndex;
      this.outIndex = (this.outIndex + 1) % this.capacity;
      this.count--;

      this.semaphores.mutex = 1;
      this.semaphores.empty++;
      this.consumedCount++;

      return {
        success: true,
        item,
        slot: targetSlot,
        blocked: false
      };
    } else if (this.syncMode === 'MUTEX_ONLY') {
      if (this.count <= 0) {
        this.raceConditionDetected = true;
        this.raceMessage = `Buffer UNDERFLOW! Consumer attempted to read from empty buffer!`;
        return {
          success: false,
          blocked: true,
          reason: this.raceMessage
        };
      }

      this.semaphores.mutex = 0;
      const item = this.slots[this.outIndex];
      this.slots[this.outIndex] = null;
      const targetSlot = this.outIndex;
      this.outIndex = (this.outIndex + 1) % this.capacity;
      this.count = Math.max(0, this.count - 1);
      this.semaphores.mutex = 1;
      this.consumedCount++;

      return { success: true, item, slot: targetSlot, blocked: false };
    } else {
      // NONE
      if (this.count <= 0) {
        this.raceConditionDetected = true;
        this.raceMessage = `RACE CONDITION: Consumer read invalid memory from empty slot ${this.outIndex}!`;
      }
      const item = this.slots[this.outIndex] || { id: 0, val: 'GARBAGE' };
      this.slots[this.outIndex] = null;
      const targetSlot = this.outIndex;
      this.outIndex = (this.outIndex + 1) % this.capacity;
      this.count = Math.max(0, this.count - 1);
      this.consumedCount++;

      return {
        success: true,
        item,
        slot: targetSlot,
        blocked: false,
        race: this.raceConditionDetected
      };
    }
  }

  reset() {
    this.slots = new Array(this.capacity).fill(null);
    this.inIndex = 0;
    this.outIndex = 0;
    this.count = 0;
    this.semaphores = {
      empty: this.capacity,
      full: 0,
      mutex: 1
    };
    this.producedCount = 0;
    this.consumedCount = 0;
    this.raceConditionDetected = false;
    this.raceMessage = null;
  }

  getSnapshot() {
    return {
      capacity: this.capacity,
      syncMode: this.syncMode,
      slots: [...this.slots],
      inIndex: this.inIndex,
      outIndex: this.outIndex,
      count: this.count,
      semaphores: { ...this.semaphores },
      producedCount: this.producedCount,
      consumedCount: this.consumedCount,
      raceConditionDetected: this.raceConditionDetected,
      raceMessage: this.raceMessage,
      isFull: this.count >= this.capacity,
      isEmpty: this.count === 0
    };
  }
}

