document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

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
    
    // Render Logs Incrementally O(1)
    if (state.logs) {
      // Handle state reset/restarts or out-of-sync
      if (state.totalLogs < lastRenderedTotalLogs) {
        logDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      const isDefaultState = logDiv.children.length === 0;

      if (isDefaultState && lastRenderedTotalLogs === 0 && state.logs.length > 0) {
        logDiv.innerHTML = '';
        const fragment = document.createDocumentFragment();
        state.logs.forEach(l => {
          const entry = document.createElement('div');
          entry.textContent = `> ${l}`;
          fragment.appendChild(entry);
        });
        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = state.totalLogs;
        logDiv.scrollTop = logDiv.scrollHeight;
      } else if (state.totalLogs > lastRenderedTotalLogs) {
        // Calculate new logs to append
        const newLogsCount = Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length);
        if (newLogsCount > 0) {
          const newLogs = state.logs.slice(-newLogsCount);
          const fragment = document.createDocumentFragment();
          newLogs.forEach(l => {
            const entry = document.createElement('div');
            entry.textContent = `> ${l}`;
            fragment.appendChild(entry);
          });
          logDiv.appendChild(fragment);
          lastRenderedTotalLogs = state.totalLogs;

          // Limit DOM size to 50 elements
          while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.firstChild);
          }

          logDiv.scrollTop = logDiv.scrollHeight;
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

  // Listen for direct messages/events
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'CLEAR_LOGS') {
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
