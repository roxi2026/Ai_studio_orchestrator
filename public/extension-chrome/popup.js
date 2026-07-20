document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Incremental Log Tracker
  let lastRenderedTotalLogs = 0;

  function updateUI(state) {
    statusDiv.textContent = state.status;
    if (state.status === 'Running') {
        statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
    } else if (state.status === 'Error') {
        statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
    } else {
        statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
    }
    
    // O(1) Incremental Rendering of logs with DocumentFragment & XSS-safe textContent
    if (state.logs) {
      if (state.totalLogs < lastRenderedTotalLogs) {
        lastRenderedTotalLogs = 0;
        logDiv.textContent = '';
      }

      const currentTotalLogs = state.totalLogs || 0;
      if (currentTotalLogs > lastRenderedTotalLogs) {
        const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);
        const startIndex = state.logs.length - newLogsCount;
        const logsToAppend = state.logs.slice(startIndex);

        if (logsToAppend.length > 0) {
          const fragment = document.createDocumentFragment();

          logsToAppend.forEach(logLine => {
            const entryDiv = document.createElement('div');
            entryDiv.textContent = `> ${logLine}`;
            fragment.appendChild(entryDiv);
          });

          logDiv.appendChild(fragment);
          logDiv.scrollTop = logDiv.scrollHeight;
        }

        lastRenderedTotalLogs = currentTotalLogs;
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
