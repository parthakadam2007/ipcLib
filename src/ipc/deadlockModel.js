// Deadlock & Concurrency IPC Model
// Simulates Resource Allocation Graphs (RAG), Coffman conditions, and cycle detection

export class DeadlockModel {
  constructor() {
    this.processes = [
      { id: 'P1', name: 'Process 1', state: 'RUNNING', holding: [], waitingFor: null },
      { id: 'P2', name: 'Process 2', state: 'RUNNING', holding: [], waitingFor: null },
      { id: 'P3', name: 'Process 3', state: 'RUNNING', holding: [], waitingFor: null }
    ];

    this.resources = [
      { id: 'R1', name: 'Resource 1 (Printer Mutex)', heldBy: null, instances: 1 },
      { id: 'R2', name: 'Resource 2 (Disk File Lock)', heldBy: null, instances: 1 },
      { id: 'R3', name: 'Resource 3 (Shared Memory Segment)', heldBy: null, instances: 1 }
    ];

    this.deadlockDetected = false;
    this.deadlockCycle = [];
    this.coffmanConditions = {
      mutualExclusion: true,
      holdAndWait: false,
      noPreemption: true,
      circularWait: false
    };
  }

  // Request a resource
  requestResource(processId, resourceId) {
    const proc = this.processes.find(p => p.id === processId);
    const res = this.resources.find(r => r.id === resourceId);

    if (!proc || !res) return { success: false, error: 'Process or resource not found' };

    if (res.heldBy === null) {
      // Allocate immediately
      res.heldBy = processId;
      proc.holding.push(resourceId);
      proc.waitingFor = null;
      proc.state = 'RUNNING';
      this.checkDeadlock();
      return { success: true, allocated: true, processId, resourceId };
    } else if (res.heldBy === processId) {
      return { success: true, allocated: true, note: 'Already held' };
    } else {
      // Resource is busy, process must wait!
      proc.waitingFor = resourceId;
      proc.state = 'BLOCKED';
      this.checkDeadlock();
      return {
        success: true,
        allocated: false,
        blocked: true,
        holder: res.heldBy,
        processId,
        resourceId
      };
    }
  }

  // Release a resource
  releaseResource(processId, resourceId) {
    const proc = this.processes.find(p => p.id === processId);
    const res = this.resources.find(r => r.id === resourceId);

    if (!proc || !res) return { success: false, error: 'Not found' };
    if (res.heldBy !== processId) return { success: false, error: 'Not held by this process' };

    res.heldBy = null;
    proc.holding = proc.holding.filter(r => r !== resourceId);

    // Check if any process is waiting for this resource
    const waitingProc = this.processes.find(p => p.waitingFor === resourceId);
    if (waitingProc) {
      res.heldBy = waitingProc.id;
      waitingProc.holding.push(resourceId);
      waitingProc.waitingFor = null;
      waitingProc.state = 'RUNNING';
    }

    this.checkDeadlock();
    return { success: true, unblocked: waitingProc ? waitingProc.id : null };
  }

  // Detect cycle in Resource Allocation Graph
  checkDeadlock() {
    // A cycle in single-instance RAG indicates deadlock
    const graph = {}; // adj list
    for (const p of this.processes) {
      if (p.waitingFor) {
        const res = this.resources.find(r => r.id === p.waitingFor);
        if (res && res.heldBy) {
          // P waiting on heldBy process
          graph[p.id] = res.heldBy;
        }
      }
    }

    let cycleFound = [];
    for (const p of this.processes) {
      const visited = new Set();
      let curr = p.id;
      const path = [];

      while (curr && graph[curr]) {
        if (visited.has(curr)) {
          // Cycle found!
          const cycleStart = path.indexOf(curr);
          cycleFound = path.slice(cycleStart);
          cycleFound.push(curr);
          break;
        }
        visited.add(curr);
        path.push(curr);
        curr = graph[curr];
      }
      if (cycleFound.length > 0) break;
    }

    this.deadlockDetected = cycleFound.length > 0;
    this.deadlockCycle = cycleFound;

    // Evaluate Coffman conditions
    const hasHoldAndWait = this.processes.some(p => p.holding.length > 0 && p.waitingFor !== null);
    this.coffmanConditions = {
      mutualExclusion: true,
      holdAndWait: hasHoldAndWait,
      noPreemption: true,
      circularWait: this.deadlockDetected
    };

    return {
      deadlock: this.deadlockDetected,
      cycle: this.deadlockCycle,
      coffman: this.coffmanConditions
    };
  }

  // Pre-load classic deadlock scenario (P1 holds R1, wants R2; P2 holds R2, wants R1)
  loadDeadlockScenario() {
    this.reset();
    this.requestResource('P1', 'R1');
    this.requestResource('P2', 'R2');
    this.requestResource('P1', 'R2'); // P1 blocks waiting for R2
    this.requestResource('P2', 'R1'); // P2 blocks waiting for R1 -> DEADLOCK!
    return this.getSnapshot();
  }

  // Pre-load corrected scenario using Resource Hierarchy (Dijkstra's ordering)
  loadCorrectedScenario() {
    this.reset();
    // Rule: always acquire lower-indexed resource first
    // P1 acquires R1, then R2
    this.requestResource('P1', 'R1');
    this.requestResource('P1', 'R2');
    return this.getSnapshot();
  }

  reset() {
    this.processes.forEach(p => {
      p.state = 'RUNNING';
      p.holding = [];
      p.waitingFor = null;
    });
    this.resources.forEach(r => {
      r.heldBy = null;
    });
    this.deadlockDetected = false;
    this.deadlockCycle = [];
    this.coffmanConditions = {
      mutualExclusion: true,
      holdAndWait: false,
      noPreemption: true,
      circularWait: false
    };
  }

  getSnapshot() {
    return {
      processes: this.processes.map(p => ({ ...p, holding: [...p.holding] })),
      resources: this.resources.map(r => ({ ...r })),
      deadlockDetected: this.deadlockDetected,
      deadlockCycle: [...this.deadlockCycle],
      coffmanConditions: { ...this.coffmanConditions }
    };
  }
}
