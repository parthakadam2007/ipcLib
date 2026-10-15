# IPC Simulator Lab — Interactive Interprocess Communication Simulator

An interactive, modern, web-based educational operating-systems laboratory application designed for computer science students and engineers to understand Interprocess Communication (IPC), process synchronization, and concurrency concepts through visual demonstrations and hands-on experiments.

---

## 🚀 Features & Modules

### 1. 🔀 Anonymous Pipes (`pipe()`)
- Unidirectional byte stream connecting related parent and child processes.
- Visual file descriptors: `fd[0]` (read end) and `fd[1]` (write end).
- Demonstrates pipe buffer capacity, write blocking on full buffer, and read blocking on empty buffer.
- Simulated chunking and data streaming.

### 2. 🧠 Shared Memory (`shmget` / `mmap`)
- Direct zero-copy access to mapped physical RAM address frames (`0x7FFE0400`).
- Demonstration of concurrent access and **race conditions** (lost updates).
- Mutex-based critical section synchronization toggle (`pthread_mutex_lock`).
- Before-and-after memory value diff inspection.

### 3. 📬 POSIX Message Queues (`mq_send` / `mq_receive`)
- Kernel-managed discrete message packets with strict boundaries.
- Support for both **FIFO ordering** and **Priority preemption** (Priorities 1 to 5).
- Configurable queue capacity with blocking flow control.
- Demonstrates non-blocking I/O (`IPC_NOWAIT` / `O_NONBLOCK` returning `EAGAIN` or `ENOMSG`).

### 4. 🌐 Sockets (`AF_INET` / `SOCK_STREAM`)
- TCP client-server connection lifecycle.
- Step-by-step visual **TCP 3-Way Handshake**: `SYN` $\rightarrow$ `SYN-ACK` $\rightarrow$ `ACK`.
- Full request-response cycle and disconnect operations.
- Server outage / disconnection error simulation (`ECONNREFUSED`).

### 5. ⚡ Asynchronous Signals (`kill()` & `sigaction`)
- POSIX software interrupts: `SIGINT`, `SIGTERM`, `SIGKILL`, `SIGUSR1`, `SIGUSR2`, `SIGSTOP`, `SIGCONT`.
- Visual signal frame delivery into the target process pending signal mask.
- Demonstrates uncatchable signals (`SIGKILL` and `SIGSTOP`) vs customizable user signal handlers.

### 6. 📁 Named Pipes / FIFOs (`mkfifo()`)
- Communication between **unrelated processes** via filesystem inode `/tmp/app_ipc.fifo`.
- Demonstrates blocking `open()` synchronization (reader sleeps until writer connects).

### 7. 🔄 Featured Producer–Consumer Lab
- Dedicated bounded circular buffer with `in` and `out` pointers.
- Complete Dijkstra solution using counting semaphores (`empty`, `full`) and binary mutex (`mutex`).
- Comparison modes: **Dijkstra Semaphores** vs **Mutex Only** vs **Unsynchronized (Race Condition)**.

### 8. 🛡️ Deadlock & Concurrency Lab
- Interactive **Resource Allocation Graph (RAG)** with processes and mutex resources.
- Real-time cycle detection algorithm highlighting circular wait dependencies.
- Evaluation of the **4 Coffman Conditions**: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.
- Side-by-side comparison with corrected execution via **Dijkstra Resource Hierarchy Ordering**.

### 9. 📊 Architectural Matrix & Comparison
- Interactive matrix comparing all 6 mechanisms across communication model, transfer method, persistence, complexity, synchronization requirements, and POSIX system call APIs.
- Deep dive distinguishing Shared Memory (zero-copy) from Message Passing (kernel-buffered).

### 10. 🎓 Guided Tutorials & Interactive Quiz
- Multi-step tutorials with labeled architecture diagrams, real-world case studies, and common student pitfalls.
- Multi-tier knowledge quiz (Beginner, Intermediate, Advanced) with instant explanations, score tracking, local storage persistence, and confetti celebrations.

---

## 🛠️ Technology Stack

- **Framework**: React 18 / 19 with Vite
- **Styling**: Tailwind CSS with custom OS dark laboratory theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti
- **Storage**: LocalStorage API for preferences, progress, and quiz history

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository (or navigate to directory)
cd d:\ipcLib

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### Production Build

```bash
# Compile and bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Architecture

```
src/
├── components/           # Reusable UI & simulation components
│   ├── CommunicationChannel.jsx  # Animated channel, buffer slots, in-flight data
│   ├── EventLog.jsx              # Timeline log, TXT/JSON export, filters
│   ├── ExplanationPanel.jsx      # OS concept breakdown & syscall explanation
│   ├── LegendModal.jsx           # Process states, channel symbols legend
│   ├── Navbar.jsx                # Header bar, simulation status, help
│   ├── ProcessNode.jsx           # Process node with PID, state, local RAM
│   ├── Sidebar.jsx               # Navigation drawer across mechanisms & labs
│   ├── SimulationControls.jsx    # Run, Pause, Step, Reset, Speed, Scenarios
│   └── StatusBadge.jsx           # Process lifecycle badges (READY, RUNNING, etc.)
├── data/                 # Educational content & presets
│   ├── comparisonData.js         # Comprehensive 6-mechanism comparison matrix
│   ├── quizQuestions.js          # Multi-tier quiz questions & explanations
│   ├── scenarios.js              # Scenario presets for each mechanism
│   └── tutorialsData.js          # Step-by-step guides & labeled diagrams
├── engine/               # Simulation runtime
│   ├── eventLogger.js            # Reactive event stream logger
│   └── processManager.js         # Process lifecycle state machine (READY, etc.)
├── hooks/
│   └── useSimulation.js          # Deterministic stepping & playback timer hook
├── ipc/                  # Authentic conceptual OS models
│   ├── deadlockModel.js          # Resource Allocation Graph & cycle detection
│   ├── messageQueueModel.js      # POSIX message queue (FIFO / Priority)
│   ├── namedPipeModel.js         # Filesystem FIFO model with blocking open
│   ├── pipeModel.js              # Anonymous circular byte stream pipe
│   ├── producerConsumerModel.js  # Circular bounded buffer & Dijkstra semaphores
│   ├── sharedMemoryModel.js      # Memory frames, race conditions, mutex locks
│   ├── signalModel.js            # POSIX signals, masks, trap handlers
│   └── socketModel.js            # TCP client/server, 3-way handshake
├── pages/                # Simulator workspaces & modules
│   ├── Comparison.jsx            # Architectural matrix
│   ├── Dashboard.jsx             # Hub, overview, featured mini PC demo
│   ├── DeadlockLab.jsx           # Deadlock & Concurrency lab
│   ├── MessageQueueSimulator.jsx # Message queue simulator
│   ├── NamedPipeSimulator.jsx    # Named pipe (FIFO) simulator
│   ├── PipesSimulator.jsx        # Anonymous pipe simulator
│   ├── ProducerConsumerLab.jsx   # Dedicated Producer–Consumer lab
│   ├── Quiz.jsx                  # Interactive quiz assessment
│   ├── SharedMemorySimulator.jsx # Shared memory & race condition lab
│   ├── SignalsSimulator.jsx      # Signals simulator
│   ├── SocketSimulator.jsx       # TCP socket simulator
│   └── Tutorials.jsx             # Guided learning mode
├── utils/
│   ├── export.js                 # Export logs to TXT and JSON
│   └── storage.js                # LocalStorage management
├── App.jsx               # Root application router & layout
├── index.css             # Tailwind base & custom styles
└── main.jsx              # React DOM entry
```

---

## ⚖️ Educational Notice
This application is a **conceptual simulator** built for educational purposes. It models authentic POSIX system call semantics and operating system concepts within a web-based JavaScript engine. It does not spawn native operating system processes or modify the host operating system.
