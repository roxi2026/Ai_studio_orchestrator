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
    
    // Incremental log rendering O(1)
    if (state.logs && state.logs.length > 0) {
      const currentTotal = state.totalLogs !== undefined ? state.totalLogs : state.logs.length;

      if (currentTotal < lastRenderedTotalLogs) {
        logDiv.textContent = '';
        lastRenderedTotalLogs = 0;
      }

      const newLogsCount = Math.min(currentTotal - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const fragment = document.createDocumentFragment();
        const newEntries = state.logs.slice(state.logs.length - newLogsCount);
        for (const logText of newEntries) {
          const div = document.createElement('div');
          div.textContent = `> ${logText}`;
          fragment.appendChild(div);
        }
        logDiv.appendChild(fragment);

        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedTotalLogs = currentTotal;
      }
    } else {
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
