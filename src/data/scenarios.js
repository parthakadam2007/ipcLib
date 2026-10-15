// Presets and scenarios for IPC modules

export const SCENARIOS = {
  pipes: [
    {
      id: 'pipe-basic',
      name: 'Unidirectional Streaming',
      desc: 'Standard parent-to-child data stream with small chunk sizes.',
      params: { capacity: 32, chunk: 8, message: 'Hello Child Process!' }
    },
    {
      id: 'pipe-saturation',
      name: 'Buffer Saturation (Full Pipe)',
      desc: 'Writer fills pipe buffer beyond capacity, triggering write blocking until reader drains it.',
      params: { capacity: 16, chunk: 4, message: 'A very long message that overflows 16 bytes!' }
    },
    {
      id: 'pipe-empty-block',
      name: 'Empty Pipe Starvation',
      desc: 'Reader attempts reading from an empty pipe, demonstrating blocking read syscall.',
      params: { capacity: 32, chunk: 8, message: '' }
    }
  ],
  sharedMemory: [
    {
      id: 'shm-race',
      name: 'Unsynchronized Race Condition',
      desc: 'Two processes concurrently increment a shared counter without mutex locks, resulting in lost updates.',
      params: { synchronized: false, iterations: 5 }
    },
    {
      id: 'shm-mutex',
      name: 'Mutex Synchronized Critical Section',
      desc: 'Processes acquire binary mutex lock before modifying memory, guaranteeing serializability and correctness.',
      params: { synchronized: true, iterations: 5 }
    }
  ],
  messageQueues: [
    {
      id: 'mq-fifo',
      name: 'FIFO Order Dispatch',
      desc: 'Messages are retrieved strictly in first-in-first-out order.',
      params: { mode: 'FIFO', capacity: 5 }
    },
    {
      id: 'mq-priority',
      name: 'Priority Preemption',
      desc: 'High-priority alert (Priority 5) jumps ahead of low-priority telemetry (Priority 1).',
      params: { mode: 'PRIORITY', capacity: 5 }
    },
    {
      id: 'mq-full-block',
      name: 'Queue Capacity Limit & Blocking',
      desc: 'Queue reaches max capacity; subsequent send operations block until receiver reads.',
      params: { mode: 'FIFO', capacity: 3 }
    }
  ],
  sockets: [
    {
      id: 'sock-handshake',
      name: 'Standard TCP 3-Way Handshake',
      desc: 'Step-by-step SYN -> SYN-ACK -> ACK connection setup between client and server.',
      params: { serverOnline: true }
    },
    {
      id: 'sock-refused',
      name: 'Connection Refused (Server Down)',
      desc: 'Client attempts handshake to an offline server, resulting in ECONNREFUSED.',
      params: { serverOnline: false }
    },
    {
      id: 'sock-req-res',
      name: 'HTTP / RPC Request-Response Cycle',
      desc: 'Client sends data query over established socket; server responds with computed result.',
      params: { serverOnline: true, defaultPayload: 'GET /api/system-status HTTP/1.1' }
    }
  ],
  signals: [
    {
      id: 'sig-interrupt',
      name: 'SIGINT Handling (Ctrl+C)',
      desc: 'Send interrupt signal; compare default termination vs custom signal handler.',
      params: { signal: 'SIGINT' }
    },
    {
      id: 'sig-kill',
      name: 'Uncatchable SIGKILL',
      desc: 'Demonstrate that SIGKILL bypasses all signal handlers and immediately terminates target.',
      params: { signal: 'SIGKILL' }
    },
    {
      id: 'sig-stop-cont',
      name: 'Job Control: SIGSTOP & SIGCONT',
      desc: 'Kernel freezes process execution and resumes it later without data loss.',
      params: { signal: 'SIGSTOP' }
    }
  ],
  namedPipes: [
    {
      id: 'fifo-unrelated',
      name: 'Unrelated Process Rendezvous',
      desc: 'Independent processes open /tmp/lab_fifo in the filesystem to exchange data.',
      params: { fifoPath: '/tmp/lab_fifo', capacity: 32 }
    },
    {
      id: 'fifo-blocking-open',
      name: 'Blocking Open Synchronization',
      desc: 'Reader blocks on open() until a writer connects to the FIFO endpoint.',
      params: { fifoPath: '/tmp/stream.fifo', capacity: 32 }
    }
  ],
  producerConsumer: [
    {
      id: 'pc-dijkstra',
      name: 'Dijkstra Semaphores (Standard Correct)',
      desc: 'Uses counting semaphores (empty & full) + binary mutex for complete safety.',
      params: { capacity: 5, syncMode: 'SEMAPHORES' }
    },
    {
      id: 'pc-race',
      name: 'Unsynchronized Race Condition Demo',
      desc: 'No synchronization locks; produces buffer overflow and reader garbage.',
      params: { capacity: 4, syncMode: 'NONE' }
    },
    {
      id: 'pc-mutex-only',
      name: 'Mutex Only (Missing Counting Semaphores)',
      desc: 'Buffer has mutual exclusion, but lacks counting semaphores to coordinate capacity.',
      params: { capacity: 4, syncMode: 'MUTEX_ONLY' }
    }
  ],
  deadlock: [
    {
      id: 'deadlock-circular',
      name: 'Classic Circular Wait Deadlock',
      desc: 'P1 holds R1 and wants R2; P2 holds R2 and wants R1. Circular dependency detected!',
      params: { type: 'CIRCULAR' }
    },
    {
      id: 'deadlock-hierarchy',
      name: 'Prevention via Resource Ordering',
      desc: 'Strict hierarchical resource ordering eliminates circular wait condition.',
      params: { type: 'HIERARCHY' }
    }
  ]
};
