document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastRenderedTotalLogs = 0;

  function updateUI(state) {
    if (!state) return;

    statusDiv.textContent = state.status;
    if (state.status === 'Running') {
        statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
    } else if (state.status === 'Error') {
        statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
    } else {
        statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Incremental Log Rendering
    const currentTotalLogs = state.totalLogs || state.logs.length;

    if (currentTotalLogs < lastRenderedTotalLogs || (state.logs.length === 0 && lastRenderedTotalLogs > 0)) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0) {
      const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const startIdx = state.logs.length - newLogsCount;
        const fragment = document.createDocumentFragment();

        for (let i = startIdx; i < state.logs.length; i++) {
          const entry = document.createElement('div');
          entry.textContent = `> ${state.logs[i]}`;
          fragment.appendChild(entry);
        }

        logDiv.appendChild(fragment);

        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }
        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedTotalLogs = currentTotalLogs;
      }
    }

    // Memory rendering (smaller list, so re-render is fine, but we can still optimize later)
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
