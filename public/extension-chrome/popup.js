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
    
    // Incremental O(1) Log updates using DocumentFragment
    const currentTotal = state.totalLogs || (state.logs ? state.logs.length : 0);

    if (currentTotal < lastRenderedTotalLogs) {
      logDiv.replaceChildren();
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0 && currentTotal > lastRenderedTotalLogs) {
      const newLogsCount = Math.min(currentTotal - lastRenderedTotalLogs, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      const fragment = document.createDocumentFragment();
      for (const logMsg of newLogs) {
        const item = document.createElement('div');
        item.textContent = `> ${logMsg}`;
        fragment.appendChild(item);
      }

      logDiv.appendChild(fragment);

      while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }

      logDiv.scrollTop = logDiv.scrollHeight;
      lastRenderedTotalLogs = currentTotal;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Optimized Memory Rendering using DocumentFragment
    memoryDiv.replaceChildren();
    const memoryEntries = Object.entries(state.memory || {});
    if (memoryEntries.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.textContent = 'No memory stored yet.';
      memoryDiv.appendChild(emptyDiv);
    } else {
      const memFragment = document.createDocumentFragment();
      for (const [k, v] of memoryEntries) {
        const item = document.createElement('div');
        item.className = 'memory-item';
        const keySpan = document.createElement('span');
        keySpan.className = 'memory-key';
        keySpan.textContent = `${k}: `;
        item.appendChild(keySpan);
        item.appendChild(document.createTextNode(String(v)));
        memFragment.appendChild(item);
      }
      memoryDiv.appendChild(memFragment);
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

  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) return;
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });
});
