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
    if (state.status === 'Running' || state.status === 'Executing') {
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

    // Reset check
    if (state.totalLogs !== undefined && state.totalLogs < lastRenderedTotalLogs) {
      logDiv.textContent = '';
      lastRenderedTotalLogs = 0;
    }

    // Render Logs incrementally (O(1) updates using DocumentFragment and Text Nodes)
    if (state.logs && state.logs.length > 0) {
      const totalLogs = state.totalLogs !== undefined ? state.totalLogs : state.logs.length;
      if (totalLogs > lastRenderedTotalLogs) {
        const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, state.logs.length);
        if (newLogsCount > 0) {
          const fragment = document.createDocumentFragment();
          const startIndex = state.logs.length - newLogsCount;
          const newLogs = state.logs.slice(startIndex);

          for (const logText of newLogs) {
            const div = document.createElement('div');
            div.textContent = `> ${logText}`;
            fragment.appendChild(div);
          }

          logDiv.appendChild(fragment);

          // Keep strict 50-entry cap in DOM to avoid infinite growth and memory leaks
          while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.firstChild);
          }

          // Optimized: batch scroll operation once after the incremental append loop to minimize layout reflows
          logDiv.scrollTop = logDiv.scrollHeight;
        }
        lastRenderedTotalLogs = totalLogs;
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

  // Listen for direct messages (like clearing logs)
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
