document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let currentDisplayCount = 0;

  /**
   * BOLT OPTIMIZATION: Incremental O(1) Rendering
   * Maintains O(1) DOM updates for the log list.
   */
  function appendLog(logEntry) {
    if (!logEntry) return;
    const entryDiv = document.createElement('div');
    entryDiv.appendChild(document.createTextNode(`> ${logEntry.text || logEntry}`));
    logDiv.appendChild(entryDiv);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  function updateUI(state) {
    statusDiv.textContent = state.status;
    if (state.status === 'Running') {
        statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
    } else if (state.status === 'Error') {
        statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
    } else {
        statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
    }
    
    // Incremental sync
    const stateLogCount = state.logCount || state.logs?.length || 0;

    // BOLT FIX: Handle session reset
    if (stateLogCount < currentDisplayCount) {
      logDiv.innerHTML = '';
      currentDisplayCount = 0;
    }

    if (stateLogCount > currentDisplayCount) {
      const newLogsNeeded = stateLogCount - currentDisplayCount;
      const logsToAppend = state.logs.slice(-Math.min(newLogsNeeded, 50));

      if (newLogsNeeded >= 50) {
        logDiv.innerHTML = '';
      }

      logsToAppend.forEach(appendLog);
      currentDisplayCount = stateLogCount;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';
  }

  chrome.storage.local.get(['orchestratorState'], (res) => {
    if (res.orchestratorState) updateUI(res.orchestratorState);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.orchestratorState) {
      updateUI(changes.orchestratorState.newValue);
    }
  });

  // BOLT OPTIMIZATION: Real-time O(1) Telemetry for Popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'LOG_EVENT') {
      appendLog(msg.log);
      currentDisplayCount = msg.logCount;
    }
    if (msg.action === 'CLEAR_LOGS') {
      logDiv.innerHTML = '';
      currentDisplayCount = 0;
    }
  });

  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) return;
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });
});
