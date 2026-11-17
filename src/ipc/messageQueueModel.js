// Message Queue IPC Model
// Simulates POSIX/SysV Message Queues with FIFO and Priority-based scheduling

export class MessageQueueModel {
  constructor({ capacity = 5, mode = 'FIFO' } = {}) {
    this.capacity = capacity;
    this.mode = mode; // 'FIFO' | 'PRIORITY'
    this.queue = [];
    this.totalEnqueued = 0;
    this.totalDequeued = 0;
    this.droppedCount = 0;
  }

  isFull() {
    return this.queue.length >= this.capacity;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  enqueue(message, nonBlocking = false) {
    if (this.isFull()) {
      if (nonBlocking) {
        this.droppedCount++;
        return {
          success: false,
          error: 'EAGAIN (Queue is full, IPC_NOWAIT specified)',
          blocked: false
        };
      }
      return {
        success: false,
        error: 'Queue is full. Process blocked waiting for slot.',
        blocked: true
      };
    }

    const item = {
      id: message.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: message.sender || 'P1',
      recipient: message.recipient || 'P2',
      content: message.content,
      priority: Number(message.priority) || 1,
      createdAt: new Date().toLocaleTimeString(),
    };

    if (this.mode === 'PRIORITY') {
      // Insert in descending order of priority
      let inserted = false;
      for (let i = 0; i < this.queue.length; i++) {
        if (item.priority > this.queue[i].priority) {
          this.queue.splice(i, 0, item);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.queue.push(item);
      }
    } else {
      // FIFO
      this.queue.push(item);
    }

    this.totalEnqueued++;
    return {
      success: true,
      message: item,
      queueSize: this.queue.length,
      blocked: false
    };
  }

  dequeue(nonBlocking = false) {
    if (this.isEmpty()) {
      if (nonBlocking) {
        return {
          success: false,
          error: 'ENOMSG (Queue is empty, IPC_NOWAIT specified)',
          blocked: false
        };
      }
      return {
        success: false,
        error: 'Queue is empty. Process blocked waiting for message.',
        blocked: true
      };
    }

    const item = this.queue.shift();
    this.totalDequeued++;
    return {
      success: true,
      message: item,
      queueSize: this.queue.length,
      blocked: false
    };
  }

  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  clear() {
    this.queue = [];
    this.totalEnqueued = 0;
    this.totalDequeued = 0;
    this.droppedCount = 0;
  }

  getSnapshot() {
    return {
      capacity: this.capacity,
      mode: this.mode,
      length: this.queue.length,
      items: [...this.queue],
      totalEnqueued: this.totalEnqueued,
      totalDequeued: this.totalDequeued,
      droppedCount: this.droppedCount,
    };
  }
}

