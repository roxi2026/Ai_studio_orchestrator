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
    
    // Render Logs Incrementally
    const total = state.totalLogs || 0;

    // Evaluate state resets
    if (total < lastRenderedTotalLogs) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0) {
      if (lastRenderedTotalLogs === 0) {
        logDiv.innerHTML = '';
      }

      const newLogsCount = Math.min(total - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const fragment = document.createDocumentFragment();
        const logsToRender = state.logs.slice(state.logs.length - newLogsCount);

        for (const logText of logsToRender) {
          const entry = document.createElement('div');
          const match = logText.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
          if (match) {
            entry.textContent = `> [${match[1]}] ${match[2]}`;
          } else {
            entry.textContent = `> ${logText}`;
          }
          fragment.appendChild(entry);
        }

        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = total;

        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        // Scroll once after incremental append loop to minimize layout reflows
        logDiv.scrollTop = logDiv.scrollHeight;
      }
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';
  }

  // Expose updateUI globally for testing and verification
  window.updateUI = updateUI;

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
