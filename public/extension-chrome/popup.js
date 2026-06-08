document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(message) {
    const entry = document.createElement('div');
    entry.textContent = `> ${message}`;
    logDiv.appendChild(entry);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    logDiv.scrollTop = logDiv.scrollHeight;
  }

  let lastLogCount = 0;

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
    if (state.logs && state.logs.length > lastLogCount) {
      const newLogs = state.logs.slice(lastLogCount);
      newLogs.forEach(appendLog);
      lastLogCount = state.logs.length;
    } else if (state.logs && state.logs.length < lastLogCount) {
      logDiv.innerHTML = '';
      state.logs.forEach(appendLog);
      lastLogCount = state.logs.length;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Memory update - this stays as is for now as memory is usually small,
    // but using textContent/DOM nodes for safety
    memoryDiv.innerHTML = '';
    const memoryEntries = Object.entries(state.memory || {});
    if (memoryEntries.length === 0) {
      memoryDiv.textContent = 'No memory stored yet.';
    } else {
      memoryEntries.forEach(([k, v]) => {
        const item = document.createElement('div');
        item.className = 'memory-item';
        const keySpan = document.createElement('span');
        keySpan.className = 'memory-key';
        keySpan.textContent = `${k}: `;
        item.appendChild(keySpan);
        item.appendChild(document.createTextNode(v));
        memoryDiv.appendChild(item);
      });
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
