document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function renderLogEntry(log) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.dataset.timestamp = log.timestamp;
    entry.textContent = `> ${log.text || log}`;
    logDiv.appendChild(entry);

    // Keep only last 50 logs in DOM
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
    
    // Incremental Log Rendering Optimization using timestamps for robust synchronization
    if (state.logs && state.logs.length > 0) {
      const renderedEntries = logDiv.children;
      const lastRendered = renderedEntries[renderedEntries.length - 1];
      const lastTimestamp = lastRendered ? parseFloat(lastRendered.dataset.timestamp) : null;

      if (!lastTimestamp) {
        logDiv.innerHTML = '';
        state.logs.forEach(l => renderLogEntry(l));
      } else {
        // Find the index of the last rendered log in the new state array
        const lastIndex = state.logs.findLastIndex(l => l.timestamp === lastTimestamp);
        if (lastIndex === -1) {
          // If not found, history might have shifted significantly or been cleared
          logDiv.innerHTML = '';
          state.logs.forEach(l => renderLogEntry(l));
        } else if (lastIndex < state.logs.length - 1) {
          // Append only truly new logs
          const newLogs = state.logs.slice(lastIndex + 1);
          newLogs.forEach(l => renderLogEntry(l));
        }
      }
    } else if (state.logs && state.logs.length === 0) {
      logDiv.innerHTML = '';
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
