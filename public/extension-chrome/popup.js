document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(logEntry, skipScroll = false) {
    const entry = document.createElement('div');
    if (logEntry.timestamp) {
      entry.dataset.timestamp = logEntry.timestamp;
    }
    entry.textContent = `> ${logEntry.text || logEntry}`;
    logDiv.appendChild(entry);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    if (!skipScroll) {
      logDiv.scrollTop = logDiv.scrollHeight;
    }
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
    
    // Incremental Rendering for Logs
    if (state.logs && state.logs.length > 0) {
      const existingLogs = logDiv.children;
      const lastRenderedTimestamp = existingLogs.length > 0
        ? parseInt(existingLogs[existingLogs.length - 1].dataset.timestamp)
        : 0;

      let startIndex = 0;
      if (lastRenderedTimestamp) {
        for (let i = state.logs.length - 1; i >= 0; i--) {
          if (state.logs[i].timestamp === lastRenderedTimestamp) {
            startIndex = i + 1;
            break;
          }
        }
      }

      if (startIndex > 0 || (existingLogs.length === 0 && state.logs.length > 0)) {
        for (let i = startIndex; i < state.logs.length; i++) {
          appendLog(state.logs[i], i < state.logs.length - 1);
        }
      } else if (startIndex === 0 && existingLogs.length > 0) {
        logDiv.innerHTML = '';
        state.logs.forEach((l, i) => appendLog(l, i < state.logs.length - 1));
      }
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // For memory, we keep innerHTML for now as it's typically small and changes less frequently
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
