document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Monotonic tracking counter for O(1) incremental rendering
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
    
    // Safely render Memory using a DocumentFragment
    if (state.memory) {
      const memoryEntries = Object.entries(state.memory);
      if (memoryEntries.length === 0) {
        memoryDiv.textContent = 'No memory stored yet.';
      } else {
        memoryDiv.innerHTML = '';
        const memoryFragment = document.createDocumentFragment();
        memoryEntries.forEach(([k, v]) => {
          const item = document.createElement('div');
          item.className = 'memory-item';

          const keySpan = document.createElement('span');
          keySpan.className = 'memory-key';
          keySpan.textContent = `${k}: `;
          item.appendChild(keySpan);

          item.appendChild(document.createTextNode(String(v)));
          memoryFragment.appendChild(item);
        });
        memoryDiv.appendChild(memoryFragment);
      }
    } else {
      memoryDiv.textContent = 'No memory stored yet.';
    }

    // Incremental log rendering logic
    if (state.logs) {
      if (state.totalLogs === undefined) {
        state.totalLogs = state.logs.length;
      }

      // 1. Handle state resets
      if (state.totalLogs < lastRenderedTotalLogs) {
        logDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      // 2. Initial log history restoration check
      const isDefaultState = logDiv.children.length === 0 ||
                             (logDiv.children.length === 1 && logDiv.textContent.includes('No memory'));

      if (isDefaultState && state.logs.length > 0) {
        logDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      // 3. Calculate new logs to append
      const newLogsCount = Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const newLogs = state.logs.slice(-newLogsCount);
        const fragment = document.createDocumentFragment();

        newLogs.forEach(logText => {
          const entry = document.createElement('div');
          // Prefix with "> " and render safely to prevent XSS
          entry.textContent = `> ${logText}`;
          fragment.appendChild(entry);
        });

        // Batch append to minimize layout reflows
        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = state.totalLogs;

        // 4. Enforce 50-entry cap
        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        // 5. Batch scroll operation once after appending
        logDiv.scrollTop = logDiv.scrollHeight;
      }
    }
  }

  // Fetch initial state
  chrome.storage.local.get(['orchestratorState'], (res) => {
    if (res.orchestratorState) updateUI(res.orchestratorState);
  });

  // Listen for state changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.orchestratorState) {
      updateUI(changes.orchestratorState.newValue);
    }
  });

  // Listen for CLEAR_LOGS messages to reset UI
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
