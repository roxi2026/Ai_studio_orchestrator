document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  /**
   * BOLT OPTIMIZATION: Incremental Logging
   * - Matches aistudio_ui.js logic for consistent performance.
   */
  function appendLog(logEntry) {
    const div = document.createElement('div');
    const time = typeof logEntry === 'string'
      ? new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })
      : logEntry.timestamp;
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;

    div.textContent = `[${time}] ${text}`;
    logDiv.appendChild(div);

    if (logDiv.children.length > 50) {
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
    
    // Incremental Log Rendering
    if (state.logs && state.logs.length > 0) {
      const lastStateLog = state.logs[state.logs.length - 1];
      const lastRenderedLogText = logDiv.lastElementChild ? logDiv.lastElementChild.textContent : '';
      const currentRenderedCount = logDiv.children.length;
      const totalLogs = state.logs.length;

      if (currentRenderedCount === 0 || totalLogs < currentRenderedCount) {
        logDiv.innerHTML = '';
        state.logs.forEach(l => appendLog(l));
      } else if (!lastRenderedLogText.includes(lastStateLog.text)) {
        if (totalLogs === currentRenderedCount) {
          appendLog(lastStateLog);
        } else {
          for (let i = currentRenderedCount; i < totalLogs; i++) {
            appendLog(state.logs[i]);
          }
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
