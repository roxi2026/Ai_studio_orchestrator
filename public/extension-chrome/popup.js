document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(logEntry, skipScroll = false) {
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;
    const div = document.createElement('div');
    div.textContent = `> ${text}`;
    logDiv.appendChild(div);
    if (logDiv.childNodes.length > 50) logDiv.removeChild(logDiv.firstChild);
    if (!skipScroll) logDiv.scrollTop = logDiv.scrollHeight;
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
    
    // Performance: Only render logs if the container is empty to avoid duplicates
    // since logs are also updated via storage listeners or potential future messages.
    if (state.logs && state.logs.length > 0 && logDiv.childNodes.length === 0) {
      state.logs.forEach(l => appendLog(l, true));
      logDiv.scrollTop = logDiv.scrollHeight;
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
      const newState = changes.orchestratorState.newValue;
      const oldState = changes.orchestratorState.oldValue;

      statusDiv.textContent = newState.status;

      // Incremental log updates from storage changes
      if (newState.logs && oldState) {
        const oldLogs = oldState.logs || [];
        const newLogs = newState.logs || [];

        // Find new entries by looking at the last known timestamp/text
        // This handles log rotation (length remains 50 but entries shift)
        if (newLogs.length > 0) {
          const lastOldLog = oldLogs[oldLogs.length - 1];
          const lastOldTimestamp = lastOldLog ? lastOldLog.timestamp : 0;

          const newEntries = newLogs.filter(l => l.timestamp > lastOldTimestamp);

          if (newEntries.length > 0 && newEntries.length < 50) {
            newEntries.forEach(l => appendLog(l));
          } else if (newEntries.length >= 50 || (newLogs.length < oldLogs.length && newLogs.length > 0)) {
            // Full reset if logs were cleared or a large batch arrived
            logDiv.innerHTML = '';
            newLogs.forEach(l => appendLog(l, true));
            logDiv.scrollTop = logDiv.scrollHeight;
          }
        }
      } else if (newState.logs && !oldState) {
        logDiv.innerHTML = '';
        newState.logs.forEach(l => appendLog(l, true));
        logDiv.scrollTop = logDiv.scrollHeight;
      }

      if (newState.goal && !goalInput.value) goalInput.value = newState.goal;

      memoryDiv.innerHTML = Object.entries(newState.memory || {}).map(([k, v]) =>
        `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
      ).join('') || '<div>No memory stored yet.</div>';
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
