document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Optimized Log Rendering
  function appendLog(message, skipScroll = false) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `> ${message}`;
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
    
    // Incremental Log Update
    if (state.logs && state.logs.length > 0) {
      const lastEntry = logDiv.lastElementChild;
      const lastEntryText = lastEntry ? lastEntry.textContent.replace(/^> /, '').trim() : null;

      let lastIndex = -1;
      if (lastEntryText) {
        for (let i = state.logs.length - 1; i >= 0; i--) {
          if (state.logs[i] === lastEntryText) {
            lastIndex = i;
            break;
          }
        }
      }

      if (lastIndex === -1) {
        logDiv.innerHTML = '';
        state.logs.slice(-50).forEach((l, idx, arr) => appendLog(l, idx < arr.length - 1));
        logDiv.scrollTop = logDiv.scrollHeight;
      } else if (lastIndex < state.logs.length - 1) {
        const newLogs = state.logs.slice(lastIndex + 1);
        newLogs.forEach(l => appendLog(l));
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
