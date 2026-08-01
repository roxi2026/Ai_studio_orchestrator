document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Track the count of logs already rendered locally to allow O(1) incremental rendering
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
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';

    // Evaluate state resets (e.g. orchestrator restarts)
    if (typeof state.totalLogs === 'number' && state.totalLogs < lastRenderedTotalLogs) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    // Render Logs incrementally (O(1) DOM updates via DocumentFragment and text nodes)
    if (state.logs && state.logs.length > 0) {
      const currentTotalLogs = typeof state.totalLogs === 'number' ? state.totalLogs : state.logs.length;
      const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);

      if (newLogsCount > 0) {
        if (lastRenderedTotalLogs === 0) {
          logDiv.innerHTML = '';
        }

        const newLogs = state.logs.slice(state.logs.length - newLogsCount);
        const fragment = document.createDocumentFragment();

        newLogs.forEach(l => {
          const entry = document.createElement('div');
          entry.textContent = `> ${l}`;
          fragment.appendChild(entry);
        });

        logDiv.appendChild(fragment);

        // Maintain maximum DOM list capacity (50 entries)
        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        // Scroll to bottom once after the incremental append loop to minimize layout reflows
        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedTotalLogs = currentTotalLogs;
      }
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
