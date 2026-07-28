document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Monotonic tracking for O(1) incremental rendering
  let lastRenderedTotalLogs = 0;

  function appendLogElement(text) {
    const entry = document.createElement('div');
    entry.appendChild(document.createTextNode('> ' + text));
    return entry;
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
    
    // Safeguard: Reset if total logs in state is less than last rendered
    if (state.totalLogs < lastRenderedTotalLogs) {
      logDiv.textContent = '';
      lastRenderedTotalLogs = 0;
    }

    // Incremental log rendering
    if (state.logs && state.logs.length > 0) {
      const totalLogsInState = state.totalLogs !== undefined ? state.totalLogs : state.logs.length;

      if (totalLogsInState > lastRenderedTotalLogs) {
        if (lastRenderedTotalLogs === 0) {
          logDiv.textContent = '';
        }

        const newLogsCount = Math.min(totalLogsInState - lastRenderedTotalLogs, state.logs.length);
        const startIndex = state.logs.length - newLogsCount;
        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i < state.logs.length; i++) {
          fragment.appendChild(appendLogElement(state.logs[i]));
        }

        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = totalLogsInState;

        // Strict 50-entry cap in DOM to protect popups from sluggish resizing
        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        // Batch scroll reflow
        logDiv.scrollTop = logDiv.scrollHeight;
      }
    } else if (!state.logs || state.logs.length === 0) {
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
