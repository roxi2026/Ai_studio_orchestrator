document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastSyncCount = 0; // Total count from background last seen

  /**
   * Appends a single log entry to the popup UI.
   */
  function appendLog(logEntry) {
    const entry = document.createElement('div');
    const text = typeof logEntry === 'object' ? logEntry.text : logEntry;
    entry.textContent = `> ${text}`;
    logDiv.appendChild(entry);

    // Maintain 50 log limit
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
    
    // Incremental Log Rendering using total logCount to handle buffer wrap-around
    const bgLogCount = state.logCount || 0;
    if (bgLogCount > lastSyncCount) {
      const newLogsToAppend = bgLogCount - lastSyncCount;
      const startIdx = Math.max(0, state.logs.length - newLogsToAppend);
      const newLogs = state.logs.slice(startIdx);

      newLogs.forEach(appendLog);
      lastSyncCount = bgLogCount;
    } else if (bgLogCount < lastSyncCount) {
      // Full reset (e.g. Orchestration restarted)
      logDiv.innerHTML = '';
      state.logs.forEach(appendLog);
      lastSyncCount = bgLogCount;
    } else if (bgLogCount === 0 && (!state.logs || state.logs.length === 0)) {
      logDiv.innerHTML = '';
      lastSyncCount = 0;
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

  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) return;
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });
});
