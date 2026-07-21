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
    
    // Render Logs - O(1) Incremental Performance Evolution
    const totalLogs = state.totalLogs || 0;

    // Fallback: full-sync if background state reset or we suffered an overrun/missed logs
    if (totalLogs < lastRenderedTotalLogs || (totalLogs - lastRenderedTotalLogs) > (state.logs || []).length) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = Math.max(0, totalLogs - (state.logs || []).length);
    }

    const newLogsCount = totalLogs - lastRenderedTotalLogs;
    if (newLogsCount > 0 && state.logs) {
      const startIndex = state.logs.length - newLogsCount;
      const newLogs = state.logs.slice(startIndex);

      // Batch DOM operations with DocumentFragment to prevent multiple reflows
      const fragment = document.createDocumentFragment();

      newLogs.forEach(l => {
        const entry = document.createElement('div');
        entry.textContent = `> ${l}`;
        fragment.appendChild(entry);
      });

      logDiv.appendChild(fragment);
      logDiv.scrollTop = logDiv.scrollHeight;
      lastRenderedTotalLogs = totalLogs;
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
