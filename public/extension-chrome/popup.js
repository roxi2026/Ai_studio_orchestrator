document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Performance-optimized incremental log rendering
  function appendLog(logEntry, skipScroll = false) {
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;
    const timestamp = typeof logEntry === 'string' ? Date.now() : logEntry.timestamp;

    const entryDiv = document.createElement('div');
    entryDiv.dataset.timestamp = timestamp;
    entryDiv.appendChild(document.createTextNode('> ' + text));
    logDiv.appendChild(entryDiv);

    // Maintain 50-entry cap
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
    
    // Render Logs - Incremental update for O(1) performance
    const logs = state.logs || [];
    if (logs.length === 0) {
      logDiv.innerHTML = '';
    } else {
      const lastEntry = logs[logs.length - 1];
      const lastTimestamp = typeof lastEntry === 'string' ? null : String(lastEntry.timestamp);
      const currentLastTimestamp = logDiv.lastChild ? logDiv.lastChild.dataset.timestamp : null;

      const isDefault = logDiv.children.length === 0;

      if (isDefault || lastTimestamp !== currentLastTimestamp) {
        let matchIdx = -1;
        if (currentLastTimestamp) {
          for (let i = logs.length - 1; i >= 0; i--) {
            if (String(logs[i].timestamp) === currentLastTimestamp) {
              matchIdx = i;
              break;
            }
          }
        }

        if (matchIdx !== -1) {
          for (let i = matchIdx + 1; i < logs.length; i++) {
            appendLog(logs[i], i < logs.length - 1);
          }
        } else {
          logDiv.innerHTML = '';
          logs.forEach((l, i) => appendLog(l, i < logs.length - 1));
        }
      }
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
