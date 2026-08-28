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
    
    // Incremental Log Rendering (O(1) DOM updates via DocumentFragment)
    if (state.logs && state.logs.length > 0) {
      const totalLogs = state.totalLogs || state.logs.length;

      if (totalLogs < lastRenderedTotalLogs || lastRenderedTotalLogs === 0) {
        logDiv.replaceChildren();
        lastRenderedTotalLogs = 0;
      }

      const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const newLogs = state.logs.slice(-newLogsCount);
        const fragment = document.createDocumentFragment();

        for (const l of newLogs) {
          const item = document.createElement('div');
          item.textContent = '> ' + l;
          fragment.appendChild(item);
        }

        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = totalLogs;

        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstElementChild);
        }

        logDiv.scrollTop = logDiv.scrollHeight;
      }
    } else {
      logDiv.replaceChildren();
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
