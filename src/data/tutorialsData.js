// Interactive tutorials and guided learning walkthroughs for IPC mechanisms

export const TUTORIALS_DATA = [
  {
    id: 'pipes',
    title: 'Pipes & Stream Communication',
    subtitle: 'Learn how parent and child processes stream data through anonymous kernel buffers.',
    badge: 'Beginner',
    readTime: '6 min',
    overview: 'An anonymous pipe is a unidirectional communication channel provided by the operating system kernel. When a parent process calls pipe(&fd), the kernel allocates a memory buffer and returns two file descriptors: fd[0] for reading and fd[1] for writing. After calling fork(), both the parent and child processes inherit these descriptors, enabling data streaming.',
    architecture: {
      title: 'Pipe Architecture & File Descriptors',
      diagram: [
        { label: 'Parent Process (P1)', desc: 'Writes to fd[1] (Write End)', color: 'blue' },
        { label: 'Kernel Pipe Buffer', desc: 'Ring buffer in kernel memory (typically 64KB)', color: 'emerald' },
        { label: 'Child Process (P2)', desc: 'Reads from fd[0] (Read End)', color: 'purple' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Initialization with pipe() syscall',
        content: 'The parent process executes pipe(fd). The OS kernel assigns two file descriptors: fd[0] pointing to the read end, and fd[1] pointing to the write end of an internal circular buffer.'
      },
      {
        step: 2,
        title: 'Process Forking',
        content: 'Parent calls fork(). The child process receives exact copies of the open file descriptors. Typically, the parent closes its read descriptor (fd[0]) and the child closes its write descriptor (fd[1]) to establish a clear unidirectional flow.'
      },
      {
        step: 3,
        title: 'Writing and Buffer Saturation',
        content: 'When the writer calls write(fd[1], buf, len), bytes are transferred into the kernel buffer. If the buffer fills to capacity, the writer is placed into the BLOCKED state by the scheduler until the reader consumes data.'
      },
      {
        step: 4,
        title: 'Reading and End-Of-File (EOF)',
        content: 'The reader invokes read(fd[0], buf, len). If the buffer is empty but the write end remains open, the reader blocks. Once all writers close fd[1], read() returns 0, indicating EOF.'
      }
    ],
    realWorldCase: 'The UNIX command line pipeline: `cat access.log | grep "404" | wc -l`. The shell executes pipe() between each program and attaches stdout of the first command to the write end, and stdin of the next to the read end.',
    commonMistakes: [
      'Forgetting to close unused pipe ends in parent or child: prevents EOF detection, leaving reader blocked forever.',
      'Assuming pipes are bidirectional: writing to fd[0] or reading from fd[1] fails with EBADF.',
      'Expecting message boundaries: pipes are raw byte streams; message framing requires delimiters or length prefixes.'
    ],
    targetSim: 'pipes'
  },
  {
    id: 'shared-memory',
    title: 'Shared Memory & Mutex Locking',
    subtitle: 'Explore zero-copy interprocess memory access, race conditions, and critical sections.',
    badge: 'Intermediate',
    readTime: '8 min',
    overview: 'Shared memory is the most efficient form of IPC on a single computer. Normally, the operating system isolates process address spaces for security and stability. With shared memory, two or more processes map the same physical RAM pages into their respective virtual address spaces, enabling direct load and store operations at full hardware memory speed.',
    architecture: {
      title: 'Virtual-to-Physical Address Translation',
      diagram: [
        { label: 'Process A Virtual Space', desc: 'Mapped page: 0x7FFF0000', color: 'blue' },
        { label: 'Shared Physical RAM Page', desc: 'Direct memory bus access without kernel copies', color: 'emerald' },
        { label: 'Process B Virtual Space', desc: 'Mapped page: 0x7FFE0400', color: 'purple' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Allocation and Mapping',
        content: 'Processes use shm_open() or shmget() followed by mmap() / shmat() to bind the shared memory block into their virtual memory tables.'
      },
      {
        step: 2,
        title: 'The Race Condition Hazard',
        content: 'If Process 1 and Process 2 read a counter (value = 10) simultaneously, both compute 10 + 1 = 11, and both write 11. One increment is permanently lost! This is a classic race condition.'
      },
      {
        step: 3,
        title: 'Mutual Exclusion (Mutex)',
        content: 'To prevent lost updates, processes wrap access inside a critical section: pthread_mutex_lock(&shm->mutex) -> modify memory -> pthread_mutex_unlock(&shm->mutex).'
      }
    ],
    realWorldCase: 'Modern high-performance web servers (like NGINX worker processes sharing cache zones) and relational database buffer pools (PostgreSQL shared buffers for table pages).',
    commonMistakes: [
      'Assuming memory writes are atomic: multi-byte structures or counter increments (read-modify-write) are not atomic without hardware locks.',
      'Forgetting process-shared mutex attributes: standard mutexes work only between threads of the same process unless PTHREAD_PROCESS_SHARED is configured.'
    ],
    targetSim: 'shared-memory'
  },
  {
    id: 'message-queues',
    title: 'POSIX Message Queues',
    subtitle: 'Master asynchronous, discrete message passing with priorities and capacity limits.',
    badge: 'Beginner',
    readTime: '5 min',
    overview: 'Unlike pipes which are continuous streams of bytes, message queues store discrete packets of data called messages. Each message has an explicit length, content, and an integer priority. The kernel guarantees message boundaries, meaning a single mq_receive() call retrieves exactly one message.',
    architecture: {
      title: 'Priority Queue Structure in Kernel Memory',
      diagram: [
        { label: 'Producer Process', desc: 'Invokes mq_send() with priority tag', color: 'blue' },
        { label: 'Kernel Message Queue', desc: 'Maintains priority-sorted linked list with capacity cap', color: 'amber' },
        { label: 'Consumer Process', desc: 'Invokes mq_receive() to dequeue highest priority', color: 'emerald' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Queue Creation (mq_open)',
        content: 'A process creates a named queue (e.g. /my_lab_queue) specifying maximum messages (mq_maxmsg) and maximum message size (mq_msgsize).'
      },
      {
        step: 2,
        title: 'Sending with Priority',
        content: 'Sender transmits mq_send(mqdes, msg, len, priority). The kernel inserts the message in descending order of priority (higher numbers retrieved before lower numbers).'
      },
      {
        step: 3,
        title: 'Receiving and Capacity Blocking',
        content: 'If the queue reaches capacity, sending processes block until space becomes free, unless O_NONBLOCK is passed to return EAGAIN immediately.'
      }
    ],
    realWorldCase: 'Real-time embedded operating systems (RTOS) in avionics and automotive ECUs where high-priority sensor alerts must immediately preempt routine telemetry messages.',
    commonMistakes: [
      'Allocating a receive buffer smaller than mq_msgsize: causes mq_receive to fail with EMSGSIZE.',
      'Assuming message queues can span different computers: standard POSIX message queues are strictly local to the operating system instance.'
    ],
    targetSim: 'message-queues'
  },
  {
    id: 'sockets',
    title: 'Network & UNIX Domain Sockets',
    subtitle: 'Learn connection lifecycles, TCP 3-way handshakes, and client-server communication.',
    badge: 'Intermediate',
    readTime: '7 min',
    overview: 'Sockets are the universal standard for communication across processes, whether running on the same computer (UNIX domain sockets) or across the global Internet (TCP/IP sockets). Sockets follow a client-server architecture with distinct states: LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED, and CLOSED.',
    architecture: {
      title: 'TCP Connection Handshake & Data Channel',
      diagram: [
        { label: 'Client (127.0.0.1:54320)', desc: 'Connects, sends request packets, awaits response', color: 'blue' },
        { label: 'Network / Loopback Channel', desc: 'Packet sequencing, ACKs, flow control', color: 'cyan' },
        { label: 'Server (127.0.0.1:8080)', desc: 'Listens, accepts connection, serves requests', color: 'emerald' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Server Binding and Listening',
        content: 'The server executes socket(), bind(ip, port), and listen(backlog). The socket enters the LISTEN state awaiting incoming client connections.'
      },
      {
        step: 2,
        title: 'The TCP 3-Way Handshake',
        content: 'Client sends SYN (synchronize). Server replies SYN-ACK. Client returns ACK. Once completed, both sides transition to ESTABLISHED.'
      },
      {
        step: 3,
        title: 'Request-Response Transmission',
        content: 'The client writes a query via send(). The packet traverses the channel to the server\'s socket receive buffer. The server reads it, computes a response, and transmits it back.'
      }
    ],
    realWorldCase: 'Web browsers communicating with HTTP servers, microservices architectures communicating over gRPC, and Docker daemons interacting with clients via /var/run/docker.sock.',
    commonMistakes: [
      'Not handling partial reads and writes in TCP streams: TCP is a byte stream, so one send() does not guarantee one recv().',
      'Failing to handle connection drops or server restarts gracefully.'
    ],
    targetSim: 'sockets'
  },
  {
    id: 'producer-consumer',
    title: 'Producer-Consumer & Semaphores',
    subtitle: 'Deep dive into Dijkstra’s bounded buffer solution with counting and binary semaphores.',
    badge: 'Advanced',
    readTime: '9 min',
    overview: 'The Producer-Consumer problem is the cornerstone of operating systems synchronization. A producer creates data items and places them in a fixed-size circular buffer; a consumer retrieves and processes them. The challenge is ensuring the producer never inserts into a full buffer, the consumer never reads from an empty buffer, and both never manipulate buffer pointers simultaneously.',
    architecture: {
      title: 'Circular Bounded Buffer with Counting Semaphores',
      diagram: [
        { label: 'Semaphore: empty (N)', desc: 'Counts available free slots; initialized to buffer capacity', color: 'sky' },
        { label: 'Semaphore: mutex (1)', desc: 'Binary lock ensuring exclusive access to buffer array', color: 'amber' },
        { label: 'Semaphore: full (0)', desc: 'Counts populated slots; initialized to 0', color: 'emerald' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Producer Algorithm',
        content: 'wait(empty); wait(mutex); insert_item(); signal(mutex); signal(full);'
      },
      {
        step: 2,
        title: 'Consumer Algorithm',
        content: 'wait(full); wait(mutex); remove_item(); signal(mutex); signal(empty);'
      },
      {
        step: 3,
        title: 'Deadlock Hazard from Semaphore Ordering',
        content: 'Crucial: always acquire the counting semaphore (empty or full) BEFORE the mutex lock! Swapping the order (wait(mutex); wait(empty);) causes a deadly deadlock if the buffer is full.'
      }
    ],
    realWorldCase: 'CPU audio processing threads: an audio generator thread writes sound samples to a ring buffer while the sound card DMA controller reads samples for the speakers.',
    commonMistakes: [
      'Inverting wait(mutex) and wait(empty): producer grabs the mutex, finds the buffer is full, sleeps while holding the mutex, consumer can never acquire mutex to empty a slot => DEADLOCK!',
      'Using a single mutex without condition variables or counting semaphores: results in busy-wait polling loops that waste CPU cycles.'
    ],
    targetSim: 'producer-consumer'
  },
  {
    id: 'deadlock',
    title: 'Deadlock, Starvation & Coffman Conditions',
    subtitle: 'Analyze Resource Allocation Graphs (RAG) and learn prevention strategies like Resource Ordering.',
    badge: 'Advanced',
    readTime: '10 min',
    overview: 'A deadlock is a permanent state where a set of processes are blocked because each process holds a resource and waits for another resource held by another process in the same set. In 1971, Edward G. Coffman Jr. identified four necessary and sufficient conditions that must all hold simultaneously for deadlock to occur.',
    architecture: {
      title: 'The Four Coffman Conditions',
      diagram: [
        { label: '1. Mutual Exclusion', desc: 'At least one resource is held in a non-shareable mode.', color: 'rose' },
        { label: '2. Hold and Wait', desc: 'A process holds resources while requesting additional resources.', color: 'amber' },
        { label: '3. No Preemption', desc: 'Resources cannot be forcibly seized; only released voluntarily.', color: 'purple' },
        { label: '4. Circular Wait', desc: 'A closed chain of processes where each waits for a resource held by the next.', color: 'red' }
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Resource Allocation Graph (RAG)',
        content: 'Nodes represent processes (circles) and resources (boxes). Edges represent allocation (Resource -> Process) and requests (Process -> Resource).'
      },
      {
        step: 2,
        title: 'Cycle Detection',
        content: 'In single-instance resource systems, a directed cycle in the Resource Allocation Graph is both necessary and sufficient for deadlock.'
      },
      {
        step: 3,
        title: 'Deadlock Prevention via Total Ordering',
        content: 'Dijkstra proved that enforcing a global total ordering on resource acquisition (e.g., must acquire R1 before R2) mathematically prevents circular wait, eliminating deadlock entirely.'
      }
    ],
    realWorldCase: 'Database transactions locking multiple tables in opposite orders: Transaction A locks Users then Orders; Transaction B locks Orders then Users. Under high concurrency, both deadlock.',
    commonMistakes: [
      'Confusing Deadlock with Starvation: in starvation, a process waits indefinitely while other processes make progress; in deadlock, no process in the set can ever make progress.',
      'Assuming more CPU cores prevents deadlocks: deadlocks are concurrency synchronization bugs and occur regardless of core count.'
    ],
    targetSim: 'deadlock'
  }
];
