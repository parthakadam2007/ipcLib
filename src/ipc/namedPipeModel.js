// Named Pipe (FIFO) IPC Model
// Simulates filesystem-backed mkfifo, unrelated processes, blocking open, and data stream

export class NamedPipeModel {
  constructor({ fifoPath = '/tmp/lab_fifo', capacity = 32 } = {}) {
    this.fifoPath = fifoPath;
    this.capacity = capacity;
    this.buffer = '';
    this.readerAttached = false;
    this.writerAttached = false;
    this.mode = 'BLOCKING'; // 'BLOCKING' | 'NONBLOCKING'
    this.inode = 140928;
    this.totalBytesPassed = 0;
  }

  attachProcess(role) {
    if (role === 'reader') {
      this.readerAttached = true;
    } else if (role === 'writer') {
      this.writerAttached = true;
    }
    return {
      readerAttached: this.readerAttached,
      writerAttached: this.writerAttached,
      channelOpen: this.readerAttached && this.writerAttached
    };
  }

  detachProcess(role) {
    if (role === 'reader') this.readerAttached = false;
    if (role === 'writer') this.writerAttached = false;
  }

  canCommunicate() {
    return this.readerAttached && this.writerAttached;
  }

  write(text) {
    if (!this.writerAttached) {
      return { success: false, error: 'No writer process attached to FIFO' };
    }
    if (!this.readerAttached && this.mode === 'BLOCKING') {
      return { success: false, blocked: true, error: 'Writer blocked: waiting for reader to open FIFO (SIGPIPE prevention)' };
    }

    const available = this.capacity - this.buffer.length;
    if (available <= 0) {
      return { success: false, blocked: true, error: 'FIFO buffer is full. Writer blocked.' };
    }

    const chunk = text.slice(0, available);
    this.buffer += chunk;
    this.totalBytesPassed += chunk.length;

    return {
      success: true,
      writtenChunk: chunk,
      bufferLength: this.buffer.length,
      blocked: false
    };
  }

  read(bytes = 8) {
    if (!this.readerAttached) {
      return { success: false, error: 'No reader process attached to FIFO' };
    }
    if (!this.writerAttached && this.buffer.length === 0) {
      return { success: false, blocked: true, error: 'EOF or waiting for writer to open FIFO' };
    }
    if (this.buffer.length === 0) {
      return { success: false, blocked: true, error: 'FIFO buffer is empty. Reader blocked.' };
    }

    const chunk = this.buffer.slice(0, bytes);
    this.buffer = this.buffer.slice(bytes);

    return {
      success: true,
      data: chunk,
      bufferLength: this.buffer.length,
      blocked: false
    };
  }

  reset() {
    this.buffer = '';
    this.readerAttached = false;
    this.writerAttached = false;
    this.totalBytesPassed = 0;
  }

  getSnapshot() {
    return {
      fifoPath: this.fifoPath,
      inode: this.inode,
      capacity: this.capacity,
      buffer: this.buffer,
      bufferLength: this.buffer.length,
      readerAttached: this.readerAttached,
      writerAttached: this.writerAttached,
      channelOpen: this.canCommunicate(),
      totalBytesPassed: this.totalBytesPassed
    };
  }
}

