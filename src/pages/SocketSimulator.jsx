import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, Server, Laptop, Wifi, WifiOff, Send, Power, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Process, PROCESS_STATES } from '../engine/processManager';
import { SocketModel, SOCKET_STATES } from '../ipc/socketModel';
import { useSimulation } from '../hooks/useSimulation';
import { ProcessNode } from '../components/ProcessNode';
import { CommunicationChannel } from '../components/CommunicationChannel';
import { SimulationControls } from '../components/SimulationControls';
import { EventLog } from '../components/EventLog';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { SCENARIOS } from '../data/scenarios';

export const SocketSimulator = () => {
  const [requestText, setRequestText] = useState('GET /api/v1/metrics HTTP/1.1');
  const [serverOnline, setServerOnline] = useState(true);
  const [activeScenario, setActiveScenario] = useState('');

  const [clientProc, setClientProc] = useState(
    new Process({ id: 'P_CLIENT', pid: 4120, name: 'Client Process', role: '127.0.0.1:54320', initialVars: { socketState: 'CLOSED', requestsSent: 0 } })
  );
  const [serverProc, setServerProc] = useState(
    new Process({ id: 'P_SERVER', pid: 8080, name: 'Server Daemon', role: '127.0.0.1:8080 (LISTEN)', initialVars: { socketState: 'LISTEN', clientsConnected: 0 } })
  );

  const modelRef = useRef(new SocketModel());
  const [socketSnapshot, setSocketSnapshot] = useState(modelRef.current.getSnapshot());
  const [inFlightPacket, setInFlightPacket] = useState(null);

  const [explanationInfo, setExplanationInfo] = useState({
    title: 'BSD Sockets & TCP/IP Connection Lifecycle',
    concept: 'Client-Server Network Communication',
    explanation: 'Sockets provide a bidirectional communication endpoint. Before transmitting application data over TCP, client and server must perform the 3-Way Handshake (SYN -> SYN-ACK -> ACK).',
    syscall: 'socket(AF_INET, SOCK_STREAM, 0); connect(sockfd, &serv_addr, len);',
    kernelAction: 'Client allocates ephemeral port and sends TCP SYN segment with initial sequence number'
  });

  const handleAutoStep = useCallback((stepNumber, logger) => {
    const sock = modelRef.current;
    if (sock.connectionState === SOCKET_STATES.CLOSED) {
      handleHandshake(logger, stepNumber);
    } else if (sock.client.state === SOCKET_STATES.SYN_SENT) {
      handleServerAckSyn(logger, stepNumber);
    } else if (sock.server.state === SOCKET_STATES.SYN_RCVD) {
      handleCompleteHandshake(logger, stepNumber);
    } else if (sock.connectionState === SOCKET_STATES.ESTABLISHED) {
      handleSendRequest(logger, stepNumber);
    }
  }, [requestText, serverOnline]);

  const {
    isRunning,
    speed,
    setSpeed,
    stepCount,
    events,
    selectedEvent,
    setSelectedEvent,
    run,
    pause,
    step,
    reset,
    clearLog,
    logger
  } = useSimulation({
    onStepExecute: handleAutoStep,
    initialSpeed: 1
  });

  // Step 1: Client initiates Handshake (SYN)
  const handleHandshake = (activeLogger = logger, stepNum = stepCount + 1) => {
    const sock = modelRef.current;
    const res = sock.startHandshake();
    setSocketSnapshot(sock.getSnapshot());

    if (!res.success) {
      setClientProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.BLOCKED, 'connect() FAILED', res.error);
        clone.setVariable('socketState', 'ECONNREFUSED');
        return clone;
      });

      activeLogger.log({
        step: stepNum,
        process: 'Client',
        operation: 'connect() FAILED',
        details: res.error,
        status: 'error'
      });

      setExplanationInfo({
        title: 'Connection Refused: ECONNREFUSED',
        concept: 'Server Port Unreachable',
        explanation: 'The client sent a SYN packet to port 8080, but the server is offline or no process is listening on the requested port.',
        syscall: 'connect() -> -1 (ECONNREFUSED)',
        kernelAction: 'Kernel received TCP RST (Reset) from target or timeout occurred'
      });
      return;
    }

    setInFlightPacket(res.packet);
    setClientProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, 'Sent TCP SYN (Seq: 100)');
      clone.setVariable('socketState', 'SYN_SENT');
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Client',
      operation: 'TCP SYN Transmitted',
      details: 'Client dispatched SYN segment (seq=100) to 127.0.0.1:8080 to initiate session.',
      data: res.packet,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Step 1 of 3-Way Handshake: SYN',
      concept: 'TCP Session Initiation',
      explanation: 'Client sends SYN packet with sequence number 100. Socket state moves to SYN_SENT.',
      syscall: 'connect(sockfd, (struct sockaddr*)&serv_addr, sizeof(serv_addr))',
      kernelAction: 'TCP stack generates SYN segment and sets retransmission timer'
    });
  };

  // Step 2: Server responds with SYN-ACK
  const handleServerAckSyn = (activeLogger = logger, stepNum = stepCount + 1) => {
    const sock = modelRef.current;
    const res = sock.serverAcknowledgeSyn();
    if (!res.success) return;

    setSocketSnapshot(sock.getSnapshot());
    setInFlightPacket(res.packet);

    setServerProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.RUNNING, 'Sent SYN-ACK (Seq: 300, Ack: 101)');
      clone.setVariable('socketState', 'SYN_RCVD');
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Server',
      operation: 'TCP SYN-ACK Dispatched',
      details: 'Server received SYN, generated ACK (ack=101) and server SYN (seq=300).',
      data: res.packet,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Step 2 of 3-Way Handshake: SYN-ACK',
      concept: 'Server Acknowledgment & Sync',
      explanation: 'Server acknowledges client sequence number (ack=101) and supplies its own sequence number (seq=300). State moves to SYN_RCVD.',
      syscall: 'Kernel TCP stack automated handling of incoming SYN',
      kernelAction: 'Server adds connection to half-open SYN backlog queue'
    });
  };

  // Step 3: Client sends final ACK -> ESTABLISHED!
  const handleCompleteHandshake = (activeLogger = logger, stepNum = stepCount + 1) => {
    const sock = modelRef.current;
    const res = sock.completeHandshake();
    if (!res.success) return;

    setSocketSnapshot(sock.getSnapshot());
    setInFlightPacket(null);

    setClientProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.READY, 'Connection ESTABLISHED');
      clone.setVariable('socketState', 'ESTABLISHED');
      return clone;
    });

    setServerProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.READY, 'Client accepted');
      clone.setVariable('socketState', 'ESTABLISHED');
      clone.setVariable('clientsConnected', 1);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Client',
      operation: 'Handshake Completed (ESTABLISHED)',
      details: 'Client delivered final ACK (ack=301). Both endpoints transitioned to ESTABLISHED.',
      data: res.packet,
      status: 'success'
    });

    setExplanationInfo({
      title: 'Step 3 of Handshake: ACK -> ESTABLISHED',
      concept: 'Full Duplex Socket Connection Established',
      explanation: 'Connection is established. Sockets can now exchange arbitrary request and response payload data.',
      syscall: 'accept(sockfd, ...) unblocks on server; connect() returns 0 on client',
      kernelAction: 'Connection moved from SYN backlog to completed accept queue'
    });
  };

  // Send request from Client to Server
  const handleSendRequest = (activeLogger = logger, stepNum = stepCount + 1) => {
    const sock = modelRef.current;
    const payload = requestText || 'GET /data';
    const res = sock.sendData('client', payload);
    setSocketSnapshot(sock.getSnapshot());

    if (!res.success) {
      activeLogger.log({
        step: stepNum,
        process: 'Client',
        operation: 'send() Failed',
        details: res.error,
        status: 'error'
      });
      return;
    }

    setInFlightPacket(res.packet);

    setClientProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.WAITING, `Awaiting response for "${payload}"`);
      clone.setVariable('requestsSent', (clone.localVariables.requestsSent || 0) + 1);
      clone.recordSent(res.packet);
      return clone;
    });

    activeLogger.log({
      step: stepNum,
      process: 'Client',
      operation: 'send(sockfd, payload)',
      details: `Client sent request: "${payload}"`,
      data: res.packet,
      status: 'success'
    });

    // Simulate server response after brief flight
    setTimeout(() => {
      const responsePayload = `HTTP/1.1 200 OK [JSON: {"status":"healthy","load":0.14}]`;
      const resServer = sock.sendData('server', responsePayload);
      setSocketSnapshot(sock.getSnapshot());
      setInFlightPacket(resServer.packet);

      setServerProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.RUNNING, `Responded: 200 OK`);
        clone.recordSent(resServer.packet);
        return clone;
      });

      setClientProc((prev) => {
        const clone = prev.clone();
        clone.transitionTo(PROCESS_STATES.READY, 'Received 200 OK');
        clone.recordReceived(resServer.packet);
        return clone;
      });

      activeLogger.log({
        step: stepNum + 1,
        process: 'Server',
        operation: 'recv() & send(response)',
        details: `Server processed query and replied with HTTP 200 OK payload.`,
        data: resServer.packet,
        status: 'success'
      });

      setTimeout(() => setInFlightPacket(null), 700);
    }, 600);
  };

  const handleDisconnect = () => {
    const sock = modelRef.current;
    sock.disconnect();
    setSocketSnapshot(sock.getSnapshot());

    setClientProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.READY, 'Socket closed');
      clone.setVariable('socketState', 'CLOSED');
      return clone;
    });

    setServerProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(PROCESS_STATES.READY, 'Listening on 8080');
      clone.setVariable('socketState', serverOnline ? 'LISTEN' : 'CLOSED');
      clone.setVariable('clientsConnected', 0);
      return clone;
    });

    logger.log({
      step: stepCount + 1,
      process: 'Client',
      operation: 'close(sockfd)',
      details: 'Client executed close(). Connection terminated.',
      status: 'info'
    });
  };

  const handleReset = () => {
    reset(() => {
      modelRef.current.reset();
      setSocketSnapshot(modelRef.current.getSnapshot());
      setClientProc(new Process({ id: 'P_CLIENT', pid: 4120, name: 'Client Process', role: '127.0.0.1:54320', initialVars: { socketState: 'CLOSED', requestsSent: 0 } }));
      setServerProc(new Process({ id: 'P_SERVER', pid: 8080, name: 'Server Daemon', role: '127.0.0.1:8080 (LISTEN)', initialVars: { socketState: 'LISTEN', clientsConnected: 0 } }));
      setInFlightPacket(null);
    });
  };

  const handleToggleServerOnline = (online) => {
    setServerOnline(online);
    modelRef.current.setServerOnline(online);
    setSocketSnapshot(modelRef.current.getSnapshot());
    setServerProc((prev) => {
      const clone = prev.clone();
      clone.transitionTo(online ? PROCESS_STATES.READY : PROCESS_STATES.TERMINATED, online ? 'Listening on 8080' : 'Offline / Stopped');
      clone.setVariable('socketState', online ? 'LISTEN' : 'CLOSED');
      return clone;
    });
  };

  const handleSelectScenario = (scId) => {
    setActiveScenario(scId);
    const sc = SCENARIOS.sockets.find((s) => s.id === scId);
    if (!sc) return;

    handleReset();
    if (sc.params.serverOnline !== undefined) {
      handleToggleServerOnline(sc.params.serverOnline);
    }
    if (sc.params.defaultPayload) {
      setRequestText(sc.params.defaultPayload);
    }

    setExplanationInfo({
      title: `Scenario: ${sc.name}`,
      concept: sc.name,
      explanation: sc.desc,
      syscall: 'socket() scenario',
      kernelAction: `Configured serverOnline=${sc.params.serverOnline}`
    });
  };

  return (
    <div className="space-y-4">
      <SimulationControls
        isRunning={isRunning}
        onRun={run}
        onPause={pause}
        onStep={step}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        scenarios={SCENARIOS.sockets}
        activeScenarioId={activeScenario}
        onSelectScenario={handleSelectScenario}
        customControls={
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => handleToggleServerOnline(!serverOnline)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                serverOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {serverOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{serverOnline ? 'Server Online' : 'Server Down'}</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProcessNode
              process={clientProc}
              isHighlighted={clientProc.state === PROCESS_STATES.RUNNING}
              roleLabel="Client (127.0.0.1:54320)"
              customIcon={Laptop}
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                  {socketSnapshot.connectionState === SOCKET_STATES.CLOSED ? (
                    <button
                      onClick={() => handleHandshake()}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan disabled:opacity-50"
                    >
                      Connect (SYN)
                    </button>
                  ) : socketSnapshot.server.state === SOCKET_STATES.SYN_SENT ? (
                    <button
                      onClick={() => handleServerAckSyn()}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs font-mono"
                    >
                      Server SYN-ACK
                    </button>
                  ) : socketSnapshot.server.state === SOCKET_STATES.SYN_RCVD ? (
                    <button
                      onClick={() => handleCompleteHandshake()}
                      disabled={isRunning}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs font-mono"
                    >
                      Complete (ACK)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSendRequest()}
                        disabled={isRunning}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-green disabled:opacity-50"
                      >
                        Send Request
                      </button>
                      <button
                        onClick={handleDisconnect}
                        disabled={isRunning}
                        className="py-1.5 px-2.5 rounded-lg bg-dark-950 hover:bg-rose-950/40 text-rose-300 border border-slate-700 text-xs font-mono"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              }
            />

            <ProcessNode
              process={serverProc}
              isHighlighted={serverProc.state === PROCESS_STATES.RUNNING}
              roleLabel="Server Daemon (127.0.0.1:8080)"
              customIcon={Server}
              extraDetails={
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Server Status:</span>
                  <span className={`font-bold ${serverOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {serverOnline ? 'ACTIVE (Port 8080)' : 'UNREACHABLE'}
                  </span>
                </div>
              }
            />
          </div>

          <CommunicationChannel
            title="TCP / IP Loopback Network Channel"
            channelType="socket"
            capacity={1}
            currentCount={socketSnapshot.connectionState === SOCKET_STATES.ESTABLISHED ? 1 : 0}
            inFlightPacket={inFlightPacket}
            customChildren={
              <div className="w-full flex items-center justify-around py-2 font-mono text-xs">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">CLIENT SOCKET</span>
                  <span className="text-cyan-400 font-bold">{socketSnapshot.client.state}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <div className="w-12 h-0.5 bg-slate-700" />
                  <span className="text-[10px] uppercase font-bold text-slate-300">
                    {socketSnapshot.connectionState}
                  </span>
                  <div className="w-12 h-0.5 bg-slate-700" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">SERVER SOCKET</span>
                  <span className="text-emerald-400 font-bold">{socketSnapshot.server.state}</span>
                </div>
              </div>
            }
          />

          <ExplanationPanel
            title={explanationInfo.title}
            concept={explanationInfo.concept}
            explanation={explanationInfo.explanation}
            syscall={explanationInfo.syscall}
            kernelAction={explanationInfo.kernelAction}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl border border-slate-700/80 bg-dark-900/90 shadow-xl backdrop-blur-md space-y-3 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs pb-2 border-b border-slate-800 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> Request Payload
            </h4>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">HTTP / RPC Request Payload:</label>
              <input
                type="text"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Socket Protocol:</span>
                <span className="text-cyan-400 font-bold">AF_INET / SOCK_STREAM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Port Mapping:</span>
                <span>54320 → 8080</span>
              </div>
            </div>
          </div>

          <EventLog
            events={events}
            onClear={clearLog}
            mechanismName="sockets"
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>
    </div>
  );
};
