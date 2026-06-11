document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Optimization: Helper to append logs incrementally instead of O(N) re-render
  function appendLog(logEntry, skipScroll = false) {
    if (!logEntry) return;

    const entryDiv = document.createElement('div');

    let text;
    if (typeof logEntry === 'string') {
      text = logEntry;
    } else {
      text = logEntry.text;
    }

    entryDiv.textContent = '> ' + text;
    logDiv.appendChild(entryDiv);

    // Performance: Maintain a cap on DOM elements to prevent memory bloat
    if (logDiv.children.length > 50) {
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
    
    // Optimization: Incremental Log Rendering
    if (state.logs && state.logs.length > 0 && logDiv.children.length === 0) {
       logDiv.innerHTML = '';
       state.logs.forEach((l, i) => appendLog(l, i < state.logs.length - 1));
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
      const oldState = changes.orchestratorState.oldValue || { logs: [] };
      const newState = changes.orchestratorState.newValue;

      updateUI(newState);

      // Optimization: Incremental Log Update
      // Correctly handle batched logs and the sliding window (max 50)
      if (newState.logs && newState.logs.length > 0) {
        const lastOldLog = oldState.logs[oldState.logs.length - 1];
        let newEntries = [];

        if (!lastOldLog) {
          newEntries = newState.logs;
        } else {
          const lastIdx = newState.logs.findLastIndex(l => l.timestamp === lastOldLog.timestamp && l.text === lastOldLog.text);
          if (lastIdx !== -1) {
            newEntries = newState.logs.slice(lastIdx + 1);
          } else {
            newEntries = newState.logs;
          }
        }
        newEntries.forEach(entry => appendLog(entry));
      } else if (newState.logs?.length === 0) {
        logDiv.innerHTML = '';
      }
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
