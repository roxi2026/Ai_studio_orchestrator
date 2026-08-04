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
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => 
      `<div class="memory-item"><span class="memory-key">${k}:</span> ${v}</div>`
    ).join('') || '<div>No memory stored yet.</div>';

    // Render Logs Incrementally (O(1) updates)
    if (state.logs) {
      const totalLogs = state.totalLogs || 0;

      // Handle state resets (e.g. orchestration restarted)
      if (totalLogs < lastRenderedTotalLogs) {
        logDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      const isDefaultState = logDiv.children.length === 0;

      if (lastRenderedTotalLogs === 0 && isDefaultState) {
        // Initial log history restoration
        logDiv.innerHTML = '';
        const fragment = document.createDocumentFragment();
        state.logs.forEach(l => {
          const entry = document.createElement('div');
          entry.textContent = `> ${l}`;
          fragment.appendChild(entry);
        });
        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = totalLogs;
        logDiv.scrollTop = logDiv.scrollHeight;
      } else if (totalLogs > lastRenderedTotalLogs) {
        // Incremental append
        const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, state.logs.length);
        if (newLogsCount > 0) {
          const sliceStart = state.logs.length - newLogsCount;
          const newLogs = state.logs.slice(sliceStart);
          const fragment = document.createDocumentFragment();

          newLogs.forEach(l => {
            const entry = document.createElement('div');
            entry.textContent = `> ${l}`;
            fragment.appendChild(entry);
          });

          logDiv.appendChild(fragment);

          // Manage 50-entry cap
          while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.firstChild);
          }

          lastRenderedTotalLogs = totalLogs;
          logDiv.scrollTop = logDiv.scrollHeight;
        }
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

  // Listen for CLEAR_LOGS message
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
