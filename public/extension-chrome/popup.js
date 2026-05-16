document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let currentDisplayCount = 0;

  function appendLog(log) {
    if (typeof log === 'string') {
      log = { text: log, timestamp: Date.now() };
    }
    const entry = document.createElement('div');
    entry.textContent = `> ${log.text}`;
    logDiv.appendChild(entry);

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
    
    // Incremental Log Sync
    const stateLogCount = state.logCount || 0;
    if (stateLogCount < currentDisplayCount) {
      logDiv.innerHTML = '';
      currentDisplayCount = 0;
    }

    if (state.logs && stateLogCount > currentDisplayCount) {
      const newLogs = state.logs.slice(-(stateLogCount - currentDisplayCount));
      newLogs.forEach(appendLog);
      currentDisplayCount = stateLogCount;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => {
      const item = document.createElement('div');
      item.className = 'memory-item';
      const keySpan = document.createElement('span');
      keySpan.className = 'memory-key';
      keySpan.textContent = `${k}:`;
      item.appendChild(keySpan);
      item.appendChild(document.createTextNode(` ${v}`));
      return item.outerHTML;
    }).join('') || '<div>No memory stored yet.</div>';
  }

  chrome.storage.local.get(['orchestratorState'], (res) => {
    if (res.orchestratorState) updateUI(res.orchestratorState);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.orchestratorState) {
      updateUI(changes.orchestratorState.newValue);
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'LOG_EVENT') {
      appendLog(msg.log);
      currentDisplayCount = msg.logCount;
    } else if (msg.action === 'CLEAR_LOGS') {
      logDiv.innerHTML = '';
      currentDisplayCount = 0;
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
