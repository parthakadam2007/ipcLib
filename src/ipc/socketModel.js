// Socket IPC Model: Simulates network & local domain sockets with connection lifecycle
// Supports TCP 3-way handshake (SYN, SYN-ACK, ACK), data transmission, and disconnection

export const SOCKET_STATES = {
  CLOSED: 'CLOSED',
  LISTEN: 'LISTEN',
  SYN_SENT: 'SYN_SENT',
  SYN_RCVD: 'SYN_RCVD',
  ESTABLISHED: 'ESTABLISHED',
  FIN_WAIT: 'FIN_WAIT',
  ERROR: 'ERROR'
};

export class SocketModel {
  constructor() {
    this.server = {
      ip: '127.0.0.1',
      port: 8080,
      state: SOCKET_STATES.LISTEN,
      activeConnections: 0,
      isOnline: true,
      backlogQueue: []
    };

    this.client = {
      ip: '127.0.0.1',
      port: 54320,
      state: SOCKET_STATES.CLOSED
    };

    this.connectionState = SOCKET_STATES.CLOSED;
    this.inFlightPacket = null;
    this.history = [];
  }

  setServerOnline(online) {
    this.server.isOnline = online;
    if (!online) {
      this.server.state = SOCKET_STATES.CLOSED;
      this.connectionState = SOCKET_STATES.CLOSED;
      this.client.state = SOCKET_STATES.CLOSED;
      this.inFlightPacket = null;
    } else {
      this.server.state = SOCKET_STATES.LISTEN;
    }
  }

  // Step 1: Client sends SYN
  startHandshake() {
    if (!this.server.isOnline) {
      this.client.state = SOCKET_STATES.CLOSED;
      return {
        success: false,
        error: 'ECONNREFUSED: Server is offline or not listening on port 8080',
        packet: null
      };
    }

    this.client.state = SOCKET_STATES.SYN_SENT;
    const packet = {
      id: `pkt-${Date.now()}`,
      type: 'SYN',
      seq: 100,
      ack: 0,
      from: 'client',
      to: 'server',
      payload: 'SYN (Synchronize Sequence Number: 100)',
      direction: 'client-to-server'
    };
    this.inFlightPacket = packet;
    return { success: true, step: 'SYN_SENT', packet };
  }

  // Step 2: Server receives SYN and responds SYN-ACK
  serverAcknowledgeSyn() {
    if (this.client.state !== SOCKET_STATES.SYN_SENT) {
      return { success: false, error: 'No pending SYN to acknowledge' };
    }

    this.server.state = SOCKET_STATES.SYN_RCVD;
    const packet = {
      id: `pkt-${Date.now()}`,
      type: 'SYN-ACK',
      seq: 300,
      ack: 101,
      from: 'server',
      to: 'client',
      payload: 'SYN-ACK (Seq: 300, Ack: 101)',
      direction: 'server-to-client'
    };
    this.inFlightPacket = packet;
    return { success: true, step: 'SYN_RCVD', packet };
  }

  // Step 3: Client completes handshake with ACK
  completeHandshake() {
    if (this.server.state !== SOCKET_STATES.SYN_RCVD) {
      return { success: false, error: 'Cannot complete handshake: server not in SYN_RCVD' };
    }

    this.client.state = SOCKET_STATES.ESTABLISHED;
    this.server.state = SOCKET_STATES.ESTABLISHED;
    this.connectionState = SOCKET_STATES.ESTABLISHED;
    this.server.activeConnections = 1;

    const packet = {
      id: `pkt-${Date.now()}`,
      type: 'ACK',
      seq: 101,
      ack: 301,
      from: 'client',
      to: 'server',
      payload: 'ACK (Seq: 101, Ack: 301) -> Connected',
      direction: 'client-to-server'
    };
    this.inFlightPacket = null;
    return { success: true, step: 'ESTABLISHED', packet };
  }

  sendData(from, payload) {
    if (this.connectionState !== SOCKET_STATES.ESTABLISHED) {
      return { success: false, error: 'Socket is not connected. Handshake required.' };
    }

    const direction = from === 'client' ? 'client-to-server' : 'server-to-client';
    const packet = {
      id: `pkt-${Date.now()}`,
      type: 'DATA',
      seq: Math.floor(Math.random() * 1000),
      ack: Math.floor(Math.random() * 1000),
      from,
      to: from === 'client' ? 'server' : 'client',
      payload,
      direction
    };

    this.inFlightPacket = packet;
    this.history.push(packet);
    return { success: true, packet };
  }

  deliverData() {
    const packet = this.inFlightPacket;
    this.inFlightPacket = null;
    return packet;
  }

  disconnect() {
    this.client.state = SOCKET_STATES.CLOSED;
    this.server.state = this.server.isOnline ? SOCKET_STATES.LISTEN : SOCKET_STATES.CLOSED;
    this.connectionState = SOCKET_STATES.CLOSED;
    this.server.activeConnections = 0;
    this.inFlightPacket = null;
    return { success: true };
  }

  reset() {
    this.server.isOnline = true;
    this.server.state = SOCKET_STATES.LISTEN;
    this.server.activeConnections = 0;
    this.client.state = SOCKET_STATES.CLOSED;
    this.connectionState = SOCKET_STATES.CLOSED;
    this.inFlightPacket = null;
    this.history = [];
  }

  getSnapshot() {
    return {
      server: { ...this.server },
      client: { ...this.client },
      connectionState: this.connectionState,
      inFlightPacket: this.inFlightPacket ? { ...this.inFlightPacket } : null,
      historyCount: this.history.length
    };
  }
}
