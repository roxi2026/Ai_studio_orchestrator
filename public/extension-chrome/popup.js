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
    
    // Incremental Log Rendering (O(1) per entry)
    if (state.totalLogs > lastRenderedTotalLogs) {
      const newLogsCount = state.totalLogs - lastRenderedTotalLogs;

      // Clear initial state if needed
      if (lastRenderedTotalLogs === 0) {
        logDiv.innerHTML = '';
      }

      const newLogs = state.logs.slice(-newLogsCount);
      const fragment = document.createDocumentFragment();

      newLogs.forEach(l => {
        const entry = document.createElement('div');
        entry.appendChild(document.createTextNode(`> ${l}`));
        fragment.appendChild(entry);
      });

      logDiv.appendChild(fragment);

      // Enforce 50-log limit in UI
      while (logDiv.childNodes.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }

      logDiv.scrollTop = logDiv.scrollHeight;
      lastRenderedTotalLogs = state.totalLogs;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Memory remains smaller, but still worth using DocumentFragment
    const memoryFragment = document.createDocumentFragment();
    const entries = Object.entries(state.memory || {});
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No memory stored yet.';
      memoryFragment.appendChild(empty);
    } else {
      entries.forEach(([k, v]) => {
        const item = document.createElement('div');
        item.className = 'memory-item';
        const keySpan = document.createElement('span');
        keySpan.className = 'memory-key';
        keySpan.textContent = `${k}: `;
        item.appendChild(keySpan);
        item.appendChild(document.createTextNode(String(v)));
        memoryFragment.appendChild(item);
      });
    }
    memoryDiv.innerHTML = '';
    memoryDiv.appendChild(memoryFragment);
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
