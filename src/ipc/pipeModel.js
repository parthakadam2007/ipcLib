// Pipe IPC Model: simulates anonymous pipe byte stream with circular/FIFO buffer
// Models pipe() syscall, fd[0] read, fd[1] write

export class PipeModel {
  constructor({ capacity = 64 } = {}) {
    this.capacity = capacity; // in bytes or characters
    this.buffer = '';
    this.totalWritten = 0;
    this.totalRead = 0;
    this.readFd = 3;  // fd[0] in UNIX convention
    this.writeFd = 4; // fd[1] in UNIX convention
  }

  get availableSpace() {
    return this.capacity - this.buffer.length;
  }

  get availableData() {
    return this.buffer.length;
  }

  isFull() {
    return this.buffer.length >= this.capacity;
  }

  isEmpty() {
    return this.buffer.length === 0;
  }

  write(data, nonBlocking = false) {
    if (!data) return { success: false, bytesWritten: 0, error: 'Empty payload' };
    
    if (this.isFull()) {
      if (nonBlocking) {
        return { success: false, bytesWritten: 0, error: 'EAGAIN: Pipe buffer is full (non-blocking)' };
      }
      return { success: false, bytesWritten: 0, blocked: true, error: 'Buffer full: Writer blocked' };
    }

    const spaceLeft = this.capacity - this.buffer.length;
    const writeChunk = data.slice(0, spaceLeft);
    const unwritten = data.slice(spaceLeft);

    this.buffer += writeChunk;
    this.totalWritten += writeChunk.length;

    return {
      success: true,
      bytesWritten: writeChunk.length,
      writtenChunk: writeChunk,
      remainder: unwritten,
      blocked: false,
      newBufferLength: this.buffer.length
    };
  }

  read(numBytes = 8, nonBlocking = false) {
    if (this.isEmpty()) {
      if (nonBlocking) {
        return { success: false, bytesRead: 0, error: 'EAGAIN: Pipe buffer is empty (non-blocking)' };
      }
      return { success: false, bytesRead: 0, blocked: true, error: 'Buffer empty: Reader blocked' };
    }

    const readChunk = this.buffer.slice(0, numBytes);
    this.buffer = this.buffer.slice(numBytes);
    this.totalRead += readChunk.length;

    return {
      success: true,
      bytesRead: readChunk.length,
      data: readChunk,
      blocked: false,
      newBufferLength: this.buffer.length
    };
  }

  clear() {
    this.buffer = '';
    this.totalWritten = 0;
    this.totalRead = 0;
  }

  getSnapshot() {
    return {
      capacity: this.capacity,
      buffer: this.buffer,
      length: this.buffer.length,
      totalWritten: this.totalWritten,
      totalRead: this.totalRead,
      isFull: this.isFull(),
      isEmpty: this.isEmpty(),
      readFd: this.readFd,
      writeFd: this.writeFd
    };
  }
}
