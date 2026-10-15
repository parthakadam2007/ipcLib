// Comparison matrix data for all 6 IPC mechanisms

export const IPC_COMPARISONS = [
  {
    id: 'pipes',
    name: 'Anonymous Pipes',
    model: 'Message Passing (Stream)',
    dataTransfer: 'Kernel-buffered byte stream (FIFO)',
    unrelatedProcesses: 'No (Requires common ancestry, e.g. parent/child created before fork)',
    syncRequirement: 'Implicit kernel blocking (Blocks when full on write, empty on read)',
    buffering: 'Kernel buffer (typically 64KB on Linux, pipe buffer capacity)',
    performance: 'High throughput for linear streams; incurs 2 kernel copy operations per transfer',
    complexity: 'Low (Simple file descriptor read/write API)',
    posixApis: 'pipe(), read(), write(), close()',
    useCases: 'Shell pipelines (ls | grep), parent-child process coordination, stream filtering',
    advantages: [
      'Extremely simple and intuitive programming model',
      'Automatic flow control and kernel-managed blocking',
      'Clean teardown with EOF on write-end close'
    ],
    limitations: [
      'Unidirectional only (two pipes required for duplex communication)',
      'Cannot connect unrelated processes or cross network boundaries',
      'No message boundaries (raw continuous byte stream)'
    ]
  },
  {
    id: 'named-pipes',
    name: 'Named Pipes (FIFOs)',
    model: 'Message Passing (Stream)',
    dataTransfer: 'Filesystem-addressed kernel byte stream (FIFO)',
    unrelatedProcesses: 'Yes (Identified by a path in the filesystem, e.g., /tmp/my_fifo)',
    syncRequirement: 'Implicit kernel blocking + blocking open until both endpoints connect',
    buffering: 'Kernel pipe buffer (persists in memory while open; inode on disk)',
    performance: 'Identical to anonymous pipes once opened; slight inode lookup overhead at open',
    complexity: 'Low to Moderate (Requires managing filesystem paths and permissions)',
    posixApis: 'mkfifo(), open(), read(), write(), unlink()',
    useCases: 'Client-server logging daemons, background service feeds, unrelated local CLI tools',
    advantages: [
      'Enables communication between completely unrelated processes',
      'Standard file I/O operations (can be redirected via bash or standard tools)',
      'Channel rendezvous handled by the kernel'
    ],
    limitations: [
      'Typically half-duplex; full-duplex requires twin FIFOs or complex protocols',
      'Potential security issues if filesystem permissions are misconfigured',
      'Blocks on open() unless O_NONBLOCK is explicitly passed'
    ]
  },
  {
    id: 'shared-memory',
    name: 'Shared Memory',
    model: 'Direct Memory Access',
    dataTransfer: 'Direct read/write to shared physical memory pages mapped into virtual address spaces',
    unrelatedProcesses: 'Yes (Identified by IPC key, POSIX name shm_open, or memory file descriptor)',
    syncRequirement: 'Explicit User Synchronization Mandatory (Mutexes, Semaphores, Atomic operations)',
    buffering: 'User-defined memory layout; no automatic kernel buffering or flow control',
    performance: 'Lowest latency & highest throughput for large data (zero-copy between user spaces)',
    complexity: 'High (Must manually implement synchronization, race condition prevention, and memory layouts)',
    posixApis: 'shmget(), shmat(), shmdt(), shm_open(), mmap()',
    useCases: 'High-frequency trading, video/audio processing pipelines, database buffer pools, gaming engines',
    advantages: [
      'Zero-copy transfers eliminate kernel context-switching data overhead',
      'Arbitrary complex data structures (arrays, trees, circular queues) can be shared',
      'Instantaneous visibility of writes to all attached processes'
    ],
    limitations: [
      'No built-in synchronization: fatal race conditions if uncoordinated',
      'No automatic notifications when new data is written',
      'Cannot span across different machines over a network'
    ]
  },
  {
    id: 'message-queues',
    name: 'Message Queues',
    model: 'Message Passing (Discrete Packets)',
    dataTransfer: 'Kernel-managed structured discrete messages with type/priority tags',
    unrelatedProcesses: 'Yes (Identified by IPC key / POSIX queue name /mq_name)',
    syncRequirement: 'Implicit kernel synchronization (Blocking send on full, blocking receive on empty)',
    buffering: 'Kernel message queue linked list, bounded by max messages and message size',
    performance: 'Moderate to High; kernel copies each message from sender buffer to receiver buffer',
    complexity: 'Moderate (Offers message prioritization and selective type filtering)',
    posixApis: 'mq_open(), mq_send(), mq_receive(), msgsnd(), msgrcv()',
    useCases: 'Asynchronous task workers, priority event dispatchers, command dispatchers',
    advantages: [
      'Preserves message boundaries (no custom framing or delimiter parsing required)',
      'Built-in priority scheduling: urgent messages jump ahead of normal traffic',
      'Asynchronous delivery and notification via signals (mq_notify)'
    ],
    limitations: [
      'Message size and queue depth are strictly constrained by OS kernel limits',
      'Double memory copying (user -> kernel -> user)',
      'Local machine scope only'
    ]
  },
  {
    id: 'sockets',
    name: 'Sockets (Unix Domain & Network)',
    model: 'Client-Server Communication',
    dataTransfer: 'Stream (TCP) or Datagram (UDP) via network stack or Unix domain sockets (AF_UNIX)',
    unrelatedProcesses: 'Yes (Identified by IP address + Port, or filesystem socket path)',
    syncRequirement: 'Implicit flow control (TCP sliding window, socket buffer queues)',
    buffering: 'Configurable socket send/receive buffers (SO_SNDBUF, SO_RCVBUF)',
    performance: 'Network sockets involve network stack & NIC overhead; Unix domain sockets are fast and bypass TCP checksums',
    complexity: 'High (Connection lifecycle, handshakes, timeouts, disconnections, framing)',
    posixApis: 'socket(), bind(), listen(), accept(), connect(), send(), recv()',
    useCases: 'Distributed systems, microservices, web browsers/servers, database clients, inter-container IPC',
    advantages: [
      'Universal standard: works transparently across local processes AND remote internet hosts',
      'Rich ecosystem supporting encryption (TLS), proxies, and load balancers',
      'Full duplex bidirectional communication'
    ],
    limitations: [
      'Higher protocol overhead compared to local memory mechanisms',
      'Connection management and error handling can be complex',
      'Variable latency dependent on network congestion'
    ]
  },
  {
    id: 'signals',
    name: 'Signals',
    model: 'Asynchronous Notification',
    dataTransfer: 'Software interrupt carrying a signal integer identifier (and optional siginfo_t)',
    unrelatedProcesses: 'Yes (Any process with matching permissions/PID can signal via kill())',
    syncRequirement: 'Asynchronous interrupt; user process must register signal handlers or sigwait()',
    buffering: 'Pending signal bitmask in kernel process descriptor (standard signals do not queue)',
    performance: 'Immediate kernel-level interrupt; negligible data transfer capacity',
    complexity: 'Moderate to High (Async-signal-safety hazards in signal handlers)',
    posixApis: 'kill(), signal(), sigaction(), sigprocmask(), pause()',
    useCases: 'Process termination (SIGTERM, SIGKILL), user interrupt (SIGINT / Ctrl+C), child exit notification (SIGCHLD), timer expiry',
    advantages: [
      'Asynchronous: immediately interrupts whatever the target process was executing',
      'Very lightweight with minimal system overhead',
      'Standard OS mechanism for job control and process lifecycle management'
    ],
    limitations: [
      'Cannot transfer arbitrary data streams or bulk messages',
      'Standard signals are not queued: multiple identical signals collapse into one pending bit',
      'Writing safe signal handlers requires strict avoidance of non-reentrant functions (e.g. malloc, printf)'
    ]
  }
];

export const IPC_MODELS_SUMMARY = {
  messagePassing: {
    title: 'Message Passing',
    description: 'Processes communicate by exchanging discrete messages or byte streams via the kernel.',
    mechanisms: ['Anonymous Pipes', 'Named Pipes (FIFOs)', 'Message Queues', 'Sockets'],
    pros: 'Kernel manages synchronization and buffering; no shared memory corruption risks.',
    cons: 'Incurs context-switch and data copy overhead between user space and kernel space.'
  },
  sharedMemory: {
    title: 'Shared Memory',
    description: 'Processes share a segment of their address space to read and write directly.',
    mechanisms: ['Shared Memory Segments (shm / mmap)'],
    pros: 'Zero-copy speed, highest data throughput, ideal for massive datasets.',
    cons: 'Programmer is entirely responsible for synchronization (mutexes/semaphores) to avoid race conditions.'
  }
};
