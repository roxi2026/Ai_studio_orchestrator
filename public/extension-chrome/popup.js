document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let currentDisplayCount = 0;

  function appendLog(logEntry) {
    const entryDiv = document.createElement('div');
    const timestamp = logEntry.timestamp ? new Date(logEntry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) : '';
    const prefix = timestamp ? `[${timestamp}] ` : '> ';

    entryDiv.appendChild(document.createTextNode(prefix + (logEntry.text || logEntry)));
    logDiv.appendChild(entryDiv);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }
    logDiv.scrollTop = logDiv.scrollHeight;
    currentDisplayCount++;
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
    
    if (state.logs && state.logs.length > 0) {
      if ((state.logCount || state.logs.length) < currentDisplayCount) {
        logDiv.innerHTML = '';
        currentDisplayCount = 0;
      }

      const newLogsCount = (state.logCount || state.logs.length) - currentDisplayCount;
      if (newLogsCount > 0) {
        const startIndex = Math.max(0, state.logs.length - newLogsCount);
        for (let i = startIndex; i < state.logs.length; i++) {
          appendLog(state.logs[i]);
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

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LOG_EVENT') {
      appendLog(msg.log);
      if (msg.status) {
        statusDiv.textContent = msg.status;
        if (msg.status === 'Running') {
            statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
        } else if (msg.status === 'Error') {
            statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
        } else {
            statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
        }
      }
    } else if (msg.type === 'CLEAR_LOGS') {
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
