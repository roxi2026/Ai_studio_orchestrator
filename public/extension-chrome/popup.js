document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let currentLogCount = 0;

  function appendLog(logEntry) {
    if (!logEntry) return;
    const entryDiv = document.createElement('div');
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;
    entryDiv.appendChild(document.createTextNode(`> ${text}`));

    while (logDiv.children.length >= 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    logDiv.appendChild(entryDiv);
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
    
    // Incremental log sync
    const newLogCount = state.logCount || state.logs?.length || 0;
    if (newLogCount < currentLogCount) {
      logDiv.innerHTML = '';
      currentLogCount = 0;
    }

    if (state.logs && state.logs.length > 0) {
      const logsToAppend = state.logs.slice(state.logs.length - (newLogCount - currentLogCount));
      logsToAppend.forEach(l => appendLog(l));
      currentLogCount = newLogCount;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'LOG_EVENT') {
      appendLog(msg.log);
      currentLogCount = msg.logCount || (currentLogCount + 1);
    } else if (msg.action === 'CLEAR_LOGS') {
      logDiv.innerHTML = '';
      currentLogCount = 0;
    }
  });

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
