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
    
    // Incremental log rendering logic
    const currentTotalLogs = state.totalLogs || 0;

    // Evaluate state reset
    if (currentTotalLogs < lastRenderedTotalLogs) {
      logDiv.textContent = '';
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0 && currentTotalLogs > lastRenderedTotalLogs) {
      // Check if log container is empty or in default state before populating
      if (lastRenderedTotalLogs === 0) {
        logDiv.textContent = '';
      }

      const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      const fragment = document.createDocumentFragment();
      newLogs.forEach(logText => {
        const entry = document.createElement('div');
        entry.textContent = `> ${logText}`;
        fragment.appendChild(entry);
      });

      logDiv.appendChild(fragment);
      lastRenderedTotalLogs = currentTotalLogs;

      // Keep only up to 50 logs in DOM to reduce memory pressure
      while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.firstChild);
      }

      // Batch layout reflow (update scroll only once)
      logDiv.scrollTop = logDiv.scrollHeight;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Memory rendering using DocumentFragment for maximum performance
    const memoryKeys = Object.keys(state.memory || {});
    if (memoryKeys.length > 0) {
      const memoryFragment = document.createDocumentFragment();
      memoryKeys.forEach(k => {
        const item = document.createElement('div');
        item.className = 'memory-item';

        const keySpan = document.createElement('span');
        keySpan.className = 'memory-key';
        keySpan.textContent = `${k}:`;

        item.appendChild(keySpan);
        item.appendChild(document.createTextNode(` ${state.memory[k]}`));
        memoryFragment.appendChild(item);
      });
      memoryDiv.textContent = '';
      memoryDiv.appendChild(memoryFragment);
    } else {
      memoryDiv.textContent = 'No memory stored yet.';
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

  // Listen for direct messages
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
