// Comprehensive IPC and OS Synchronization Quiz Questions

export const QUIZ_QUESTIONS = [
  // Beginner Level
  {
    id: 'q1',
    difficulty: 'beginner',
    category: 'Pipes',
    question: 'How do standard anonymous UNIX pipes typically transfer data?',
    options: [
      'Bidirectionally between arbitrary network hosts',
      'Unidirectionally as a byte stream between related (parent-child) processes',
      'Through a persistent disk file that remains after system reboot',
      'Directly between hardware registers without kernel involvement'
    ],
    answer: 1,
    explanation: 'Anonymous pipes provide a unidirectional byte stream buffer managed by the kernel, typically created before fork() so parent and child can share file descriptors.'
  },
  {
    id: 'q2',
    difficulty: 'beginner',
    category: 'Shared Memory',
    question: 'Why is Shared Memory considered the fastest IPC mechanism on a single host?',
    options: [
      'It encrypts data before sending it over the network',
      'Processes access the same physical RAM pages directly without copying data through the kernel',
      'The CPU automatically pauses other operating system processes',
      'It does not require memory protection checks'
    ],
    answer: 1,
    explanation: 'Once mapped via virtual memory pages (e.g. shmat/mmap), reading and writing occurs at raw memory speed without kernel buffer copying overhead.'
  },
  {
    id: 'q3',
    difficulty: 'beginner',
    category: 'Signals',
    question: 'Which of the following signals CANNOT be caught, blocked, or ignored by a user process?',
    options: [
      'SIGINT (Interrupt / Ctrl+C)',
      'SIGTERM (Termination Request)',
      'SIGKILL and SIGSTOP',
      'SIGUSR1 and SIGUSR2'
    ],
    answer: 2,
    explanation: 'POSIX specifies that SIGKILL (signal 9) and SIGSTOP (signal 19) cannot be caught, blocked, or ignored, ensuring the system administrator/kernel can always halt runaway processes.'
  },
  {
    id: 'q4',
    difficulty: 'beginner',
    category: 'Sockets',
    question: 'What is the purpose of the TCP 3-way handshake in socket communication?',
    options: [
      'To encrypt the payload using TLS certificates',
      'To synchronize initial sequence numbers (SYN, SYN-ACK, ACK) and establish a reliable session',
      'To terminate the connection gracefully',
      'To compress message contents before transmission'
    ],
    answer: 1,
    explanation: 'The 3-way handshake ensures both client and server are ready and have exchanged starting sequence numbers for reliable ordered data transfer.'
  },
  {
    id: 'q5',
    difficulty: 'beginner',
    category: 'Producer-Consumer',
    question: 'In the Bounded Buffer (Producer-Consumer) problem, what occurs when a Producer tries to insert into a full buffer in a synchronized system?',
    options: [
      'The producer overwrites existing unread data',
      'The producer process blocks (waits) until an empty slot is freed by the consumer',
      'The operating system immediately kills the producer',
      'The buffer automatically doubles in size'
    ],
    answer: 1,
    explanation: 'With semaphore synchronization (sem_wait(&empty)), the producer enters a blocked/waiting state until the consumer consumes an item and signals the empty semaphore.'
  },

  // Intermediate Level
  {
    id: 'q6',
    difficulty: 'intermediate',
    category: 'Named Pipes',
    question: 'What is the primary architectural difference between an Anonymous Pipe and a Named Pipe (FIFO)?',
    options: [
      'Named pipes exist in the filesystem directory structure and allow unrelated processes to communicate',
      'Anonymous pipes are slower because they use disk storage',
      'Named pipes cannot transfer binary data',
      'Anonymous pipes can bridge different computers across a local network'
    ],
    answer: 0,
    explanation: 'Named pipes (created via mkfifo) have a directory entry and filesystem path, enabling communication between independent, unrelated processes without shared ancestry.'
  },
  {
    id: 'q7',
    difficulty: 'intermediate',
    category: 'Synchronization',
    question: 'What is a "Race Condition" in the context of concurrent processes accessing shared data?',
    options: [
      'When two processes run on the fastest available CPU core',
      'When the outcome of execution depends unpredictably on the order or timing of thread/process scheduling',
      'When a network socket packet arrives earlier than scheduled',
      'When the OS scheduler runs out of time slices'
    ],
    answer: 1,
    explanation: 'A race condition happens when concurrent threads/processes access shared resources without proper synchronization, making the final value depend on non-deterministic interleaving.'
  },
  {
    id: 'q8',
    difficulty: 'intermediate',
    category: 'Deadlock',
    question: 'Which of the following is NOT one of the four Coffman conditions necessary for deadlock to occur?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'No Preemption',
      'Preemptive Time Slicing'
    ],
    answer: 3,
    explanation: 'The four Coffman conditions are: 1) Mutual Exclusion, 2) Hold and Wait, 3) No Preemption, and 4) Circular Wait. Time slicing is a CPU scheduling feature, not a deadlock condition.'
  },
  {
    id: 'q9',
    difficulty: 'intermediate',
    category: 'Message Queues',
    question: 'When reading from a POSIX/SysV Message Queue with IPC_NOWAIT specified on an empty queue, what happens?',
    options: [
      'The reading process sleeps indefinitely',
      'The call returns immediately with an error (ENOMSG / EAGAIN) without blocking',
      'The kernel generates a dummy blank message',
      'The process is moved to the BLOCKED queue'
    ],
    answer: 1,
    explanation: 'The IPC_NOWAIT flag enables non-blocking I/O. If no message matches the request, it returns immediately with an error rather than placing the process to sleep.'
  },
  {
    id: 'q10',
    difficulty: 'intermediate',
    category: 'Producer-Consumer',
    question: 'In Dijkstra\'s canonical Producer-Consumer solution with capacity N, what are the initial values of the semaphores empty, full, and mutex?',
    options: [
      'empty = 0, full = N, mutex = 0',
      'empty = N, full = 0, mutex = 1',
      'empty = 1, full = 1, mutex = N',
      'empty = N, full = N, mutex = 0'
    ],
    answer: 1,
    explanation: 'Initially, all N slots are free (empty = N), zero slots are occupied (full = 0), and the buffer mutual exclusion lock is unlocked (mutex = 1).'
  },

  // Advanced Level
  {
    id: 'q11',
    difficulty: 'advanced',
    category: 'Deadlock Prevention',
    question: 'How does Dijkstra\'s Resource Hierarchy (total resource ordering) successfully prevent deadlock?',
    options: [
      'By allowing arbitrary preemption of any held lock at any time',
      'By forcing all processes to request resources in strictly ascending numerical order, thereby eliminating the possibility of a Circular Wait',
      'By increasing the number of available resource instances indefinitely',
      'By executing all processes serially on a single core'
    ],
    answer: 1,
    explanation: 'If every process requests resources according to a global strict total order (R_1 < R_2 < ... < R_k), a cycle of wait dependencies cannot form, structurally eliminating Circular Wait.'
  },
  {
    id: 'q12',
    difficulty: 'advanced',
    category: 'Signals',
    question: 'Why are signals considered unsuitable for transferring large amounts of structured application data between processes?',
    options: [
      'Signals travel over Ethernet cables and have MTU limits',
      'Signals are asynchronous software interrupts carrying only a signal number (and optionally siginfo_t), not a buffered data stream',
      'Signals can only be sent to the kernel, never to user processes',
      'Signals require root privileges to deliver'
    ],
    answer: 1,
    explanation: 'Signals notify processes of events (e.g. division by zero, alarm expiry, termination). They lack buffering channels, flow control, and data stream semantics.'
  },
  {
    id: 'q13',
    difficulty: 'advanced',
    category: 'Pipes',
    question: 'What occurs if a process attempts to write to a pipe whose read end has already been completely closed by all reading processes?',
    options: [
      'The bytes are silently discarded with return value 0',
      'The kernel sends SIGPIPE signal to the writer and write() returns -1 with errno set to EPIPE',
      'The write blocks indefinitely waiting for a new reader',
      'The system restarts the reader process'
    ],
    answer: 1,
    explanation: 'Writing to a broken pipe causes the operating system to deliver SIGPIPE to the writing process (default behavior: terminate) or return EPIPE if the signal is handled/ignored.'
  },
  {
    id: 'q14',
    difficulty: 'advanced',
    category: 'Shared Memory',
    question: 'What is the "ABA Problem" that can occur in lock-free shared memory synchronization using Compare-And-Swap (CAS)?',
    options: [
      'A memory segment is mapped to addresses A, B, and A again',
      'A location read with value A is changed to B and then back to A, causing CAS to succeed even though underlying state changed',
      'Two processes deadlock when attempting to allocate buffer A before buffer B',
      'The CPU cache invalidates addresses in alternating sequence'
    ],
    answer: 1,
    explanation: 'In lock-free algorithms, if thread 1 reads value A, thread 2 alters A -> B -> A, thread 1\'s CAS compares against A and falsely concludes no intermediate change occurred.'
  },
  {
    id: 'q15',
    difficulty: 'advanced',
    category: 'IPC Comparison',
    question: 'Under what specific circumstance are UNIX Domain Sockets preferred over standard Internet (TCP/IP) Sockets for local IPC?',
    options: [
      'When connecting to a remote server across the public internet',
      'When processes reside on the same host, avoiding TCP protocol overhead, checksums, and packet routing while preserving socket APIs',
      'When processes need to bypass filesystem permissions entirely',
      'When communicating with bare metal embedded microcontrollers without RAM'
    ],
    answer: 1,
    explanation: 'UNIX domain sockets (AF_UNIX) provide standard stream or datagram socket APIs while operating purely within the local kernel memory, avoiding network stack latency and packetization.'
  }
];
