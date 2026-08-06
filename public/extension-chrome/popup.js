document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Monotonic tracking for incremental UI rendering
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
    
    // O(1) Incremental Rendering of Logs
    const currentTotalLogs = state.totalLogs || 0;

    // Check for a reset/restart state
    if (currentTotalLogs < lastRenderedTotalLogs) {
      logDiv.textContent = '';
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0 && currentTotalLogs > lastRenderedTotalLogs) {
      // Calculate how many new entries are present
      const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      const fragment = document.createDocumentFragment();

      newLogs.forEach(logMessage => {
        const entry = document.createElement('div');
        entry.appendChild(document.createTextNode('> ' + logMessage));
        fragment.appendChild(entry);
      });

      // Append DocumentFragment to container to trigger exactly 1 layout/reflow
      logDiv.appendChild(fragment);
      lastRenderedTotalLogs = currentTotalLogs;

      // Keep strict 50-entry cap
      while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }

      // Scroll to bottom once
      logDiv.scrollTop = logDiv.scrollHeight;
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

  // Listen for direct messages like CLEAR_LOGS
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'CLEAR_LOGS') {
      logDiv.textContent = '';
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
