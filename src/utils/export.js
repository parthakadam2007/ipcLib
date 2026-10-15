// Export simulation logs to JSON or TXT format

export const exportLogToJson = (logs, mechanismName) => {
  const data = {
    simulator: "IPC Simulator Lab",
    version: "1.0.0",
    mechanism: mechanismName,
    exportedAt: new Date().toISOString(),
    eventCount: logs.length,
    events: logs
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `ipc-${mechanismName}-log-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportLogToTxt = (logs, mechanismName) => {
  const header = `=======================================================\n` +
                 `  IPC SIMULATOR LAB - EXECUTION EVENT LOG\n` +
                 `  Mechanism: ${mechanismName.toUpperCase()}\n` +
                 `  Exported: ${new Date().toLocaleString()}\n` +
                 `=======================================================\n\n`;

  const rows = logs.map(e => {
    return `[STEP ${e.step.toString().padStart(3, '0')}] [${e.timestamp}] [PROCESS: ${e.process || 'KERNEL'}] [${e.status.toUpperCase()}]\n` +
           `  Action:   ${e.operation}\n` +
           `  Details:  ${e.details || 'None'}\n` +
           (e.data ? `  Data:     ${JSON.stringify(e.data)}\n` : '') +
           (e.stateChange ? `  State:    ${e.stateChange.from} -> ${e.stateChange.to}\n` : '') +
           `-------------------------------------------------------`;
  }).join('\n');

  const textContent = header + rows;
  const encodedUri = `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', `ipc-${mechanismName}-log-${Date.now()}.txt`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
