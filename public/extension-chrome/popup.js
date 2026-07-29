document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // State Management & O(1) Incremental Rendering Tracker
  let lastRenderedTotalLogs = 0;

  function createLogElement(logText) {
    const el = document.createElement('div');
    const match = logText.match(/^\[(\d{2}:\d{2}:\d{2})\] (.*)$/);
    if (match) {
      el.textContent = `> [${match[1]}] ${match[2]}`;
    } else {
      el.textContent = `> ${logText}`;
    }
    return el;
  }

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

    // Verify if state has reset
    if (typeof state.totalLogs === 'number' && state.totalLogs < lastRenderedTotalLogs) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    // Check if container is in its default state
    const isDefaultState = logDiv.innerHTML.trim() === "" || logDiv.children.length === 0;
    let logsUpdated = false;

    if (state.logs && state.logs.length > 0) {
      // 1. Initial history restoration
      if (lastRenderedTotalLogs === 0 && isDefaultState) {
        logDiv.innerHTML = '';
        const fragment = document.createDocumentFragment();
        state.logs.forEach(l => {
          fragment.appendChild(createLogElement(l));
        });
        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = state.totalLogs || state.logs.length;
        logsUpdated = true;
      }
      // 2. Incremental update
      else {
        const currentTotal = state.totalLogs || state.logs.length;
        if (currentTotal > lastRenderedTotalLogs) {
          const newLogsCount = Math.min(currentTotal - lastRenderedTotalLogs, state.logs.length);
          if (newLogsCount > 0) {
            const fragment = document.createDocumentFragment();
            const startIdx = state.logs.length - newLogsCount;
            const newLogs = state.logs.slice(startIdx);

            newLogs.forEach(l => {
              fragment.appendChild(createLogElement(l));
            });
            logDiv.appendChild(fragment);
            lastRenderedTotalLogs = currentTotal;
            logsUpdated = true;
          }
        }
      }
    }

    // Enforce 50-entry cap and perform batch scroll to minimize layout reflows
    if (logsUpdated) {
      while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }
      logDiv.scrollTop = logDiv.scrollHeight;
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

  // Listen for direct messages & CLEAR_LOGS broadcast
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
