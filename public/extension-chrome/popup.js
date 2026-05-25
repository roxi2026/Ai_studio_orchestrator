document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(logEntry) {
    if (!logEntry) return;
    const div = document.createElement('div');
    const timestamp = logEntry.timestamp || Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    div.textContent = `[${timeStr}] > ${logEntry.text || logEntry}`;
    logDiv.appendChild(div);

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
    
    if (state.logs && state.logs.length > 0 && logDiv.children.length === 0) {
      state.logs.forEach(l => appendLog(l));
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
      statusDiv.textContent = newState.status;
      // Memory updates are infrequent, full re-render is fine
      memoryDiv.innerHTML = Object.entries(newState.memory || {}).map(([k, v]) =>
        `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
      ).join('') || '<div>No memory stored yet.</div>';
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'LOG_EVENT') {
      appendLog(msg.log);
    }
    if (msg.action === 'CLEAR_LOGS') {
      logDiv.innerHTML = '';
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
