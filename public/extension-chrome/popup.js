document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Incremental Log Rendering Helper
  function appendLog(logEntry, skipScroll = false) {
    const entry = document.createElement('div');
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;
    entry.appendChild(document.createTextNode(`> ${text}`));
    logDiv.appendChild(entry);

    // Maintain 50 log limit
    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    if (!skipScroll) {
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  }

  function updateUI(state) {
    if (!state) return;

    // Guard: Status update
    if (statusDiv.textContent !== state.status) {
      statusDiv.textContent = state.status;
      if (state.status === 'Running') {
          statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
      } else if (state.status === 'Error') {
          statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
      } else {
          statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
      }
    }
    
    // Guard: Goal update
    if (state.goal && !goalInput.value) goalInput.value = state.goal;

    // Optimized Incremental Log Rendering
    if (state.logs && state.logs.length > 0) {
      const currentLogs = logDiv.children;
      if (currentLogs.length === 0) {
        logDiv.innerHTML = '';
        state.logs.forEach((l, i) => appendLog(l, i < state.logs.length - 1));
      } else {
        const lastRenderedText = currentLogs[currentLogs.length - 1].textContent.replace(/^> /, '');
        const lastStateLog = state.logs[state.logs.length - 1];
        const lastStateText = typeof lastStateLog === 'string' ? lastStateLog : lastStateLog.text;

        if (lastRenderedText !== lastStateText) {
          let lastMatchIndex = -1;
          for (let i = state.logs.length - 1; i >= 0; i--) {
            const stateText = typeof state.logs[i] === 'string' ? state.logs[i] : state.logs[i].text;
            if (stateText === lastRenderedText) {
              lastMatchIndex = i;
              break;
            }
          }
          for (let i = lastMatchIndex + 1; i < state.logs.length; i++) {
            appendLog(state.logs[i], i < state.logs.length - 1);
          }
          logDiv.scrollTop = logDiv.scrollHeight;
        }
      }
    }
    
    // Memory rendering (smaller dataset, usually doesn't need same level of optimization, but kept clean)
    const memoryHTML = Object.entries(state.memory || {}).map(([k, v]) =>
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';

    if (memoryDiv.innerHTML !== memoryHTML) {
      memoryDiv.innerHTML = memoryHTML;
    }
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
