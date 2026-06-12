document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(log) {
    const entry = document.createElement('div');
    const text = typeof log === 'string' ? log : log.text;
    entry.textContent = `> ${text}`;
    logDiv.appendChild(entry);

    while (logDiv.childNodes.length > 50) {
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
    
    // Optimization: Incremental Log Rendering
    const currentLogs = Array.from(logDiv.childNodes);
    const stateLogs = state.logs || [];

    if (stateLogs.length === 0) {
      logDiv.innerHTML = '';
    } else if (currentLogs.length === 0) {
      stateLogs.forEach(l => appendLog(l));
    } else {
      const lastDisplayed = currentLogs[currentLogs.length - 1].textContent;
      const lastStateLog = stateLogs[stateLogs.length - 1];
      const lastStateText = `> ${lastStateLog.text}`;

      if (lastDisplayed !== lastStateText) {
          const lastIdx = stateLogs.findIndex(l => `> ${l.text}` === lastDisplayed);
          const newLogs = lastIdx === -1 ? stateLogs : stateLogs.slice(lastIdx + 1);
          newLogs.forEach(l => appendLog(l));
      }
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Memory is usually small, so innerHTML is acceptable here, but we can still optimize later if needed
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
