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
    
    // Incremental Log Rendering (O(1) append instead of full O(N) DOM re-render)
    if (state.logs && state.logs.length > 0) {
      const currentTotal = state.totalLogs || state.logs.length;

      // Handle state reset or backwards state shift
      if (currentTotal < lastRenderedTotalLogs) {
        logDiv.textContent = '';
        lastRenderedTotalLogs = 0;
      }

      const newCount = Math.min(currentTotal - lastRenderedTotalLogs, state.logs.length);
      if (newCount > 0) {
        const newLogs = state.logs.slice(-newCount);
        const fragment = document.createDocumentFragment();

        for (const logMsg of newLogs) {
          const itemDiv = document.createElement('div');
          itemDiv.textContent = '> ' + logMsg;
          fragment.appendChild(itemDiv);
        }

        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = currentTotal;

        // Trim old elements if count exceeds capacity (50 cap)
        while (logDiv.childNodes.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        logDiv.scrollTop = logDiv.scrollHeight;
      }
    } else if (!state.logs || state.logs.length === 0) {
      logDiv.textContent = '';
      lastRenderedTotalLogs = 0;
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
