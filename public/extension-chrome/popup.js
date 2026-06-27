document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastRenderedTotalLogs = 0;

  function appendLog(message, skipScroll = false) {
    const entry = document.createElement('div');
    entry.appendChild(document.createTextNode(`> ${message}`));
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
    
    if (state.totalLogs > lastRenderedTotalLogs) {
      const newLogsCount = Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      const fragment = document.createDocumentFragment();
      newLogs.forEach(l => {
        const entry = document.createElement('div');
        entry.appendChild(document.createTextNode(`> ${l}`));
        fragment.appendChild(entry);
      });

      logDiv.appendChild(fragment);
      while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }
      logDiv.scrollTop = logDiv.scrollHeight;
      lastRenderedTotalLogs = state.totalLogs;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';
  }

  chrome.storage.local.get(['orchestratorState'], (res) => {
    if (res.orchestratorState) {
      const state = res.orchestratorState;
      statusDiv.textContent = state.status;
      if (state.goal) goalInput.value = state.goal;

      const fragment = document.createDocumentFragment();
      state.logs.forEach(l => {
        const entry = document.createElement('div');
        entry.appendChild(document.createTextNode(`> ${l}`));
        fragment.appendChild(entry);
      });
      logDiv.innerHTML = '';
      logDiv.appendChild(fragment);
      logDiv.scrollTop = logDiv.scrollHeight;
      lastRenderedTotalLogs = state.totalLogs || state.logs.length;

      memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) =>
        `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
      ).join('') || '<div>No memory stored yet.</div>';
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.orchestratorState) {
      updateUI(changes.orchestratorState.newValue);
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LOG_EVENT') {
      if (msg.totalLogs > lastRenderedTotalLogs) {
        appendLog(msg.message);
        lastRenderedTotalLogs = msg.totalLogs;
      }
    }
    if (msg.type === 'CLEAR_LOGS') {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
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
