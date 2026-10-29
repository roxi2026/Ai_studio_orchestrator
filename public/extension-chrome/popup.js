document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastRenderedTotalLogs = 0;

  function createLogNode(message) {
    const div = document.createElement('div');
    div.textContent = `> ${message}`;
    return div;
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
    
    // Incremental O(1) log updates
    if (state.logs) {
      const currentTotal = state.totalLogs || state.logs.length;

      if (currentTotal < lastRenderedTotalLogs) {
        logDiv.textContent = '';
        lastRenderedTotalLogs = 0;
      }

      if (currentTotal > lastRenderedTotalLogs) {
        const newLogsCount = Math.min(currentTotal - lastRenderedTotalLogs, state.logs.length);
        const newLogs = state.logs.slice(-newLogsCount);

        if (lastRenderedTotalLogs === 0 && logDiv.children.length === 0 && state.logs.length > newLogs.length) {
          const fragment = document.createDocumentFragment();
          state.logs.forEach(l => fragment.appendChild(createLogNode(l)));
          logDiv.textContent = '';
          logDiv.appendChild(fragment);
        } else {
          const fragment = document.createDocumentFragment();
          newLogs.forEach(l => fragment.appendChild(createLogNode(l)));
          logDiv.appendChild(fragment);

          while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.firstElementChild);
          }
        }

        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedTotalLogs = currentTotal;
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
