document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastRenderedTotalLogs = 0;
  let isInitialRender = true;

  function createLogNode(text) {
    const entry = document.createElement('div');
    entry.textContent = `> ${text}`;
    return entry;
  }

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
    
    // Monotonic log counter & incremental append logic
    const totalLogs = typeof state.totalLogs === 'number' ? state.totalLogs : (state.logs ? state.logs.length : 0);

    if (totalLogs < lastRenderedTotalLogs) {
      logDiv.replaceChildren();
      lastRenderedTotalLogs = 0;
      isInitialRender = true;
    }

    if (state.logs && state.logs.length > 0) {
      if (isInitialRender) {
        logDiv.replaceChildren();
        isInitialRender = false;
        lastRenderedTotalLogs = 0;
      }

      const newCount = Math.min(totalLogs - lastRenderedTotalLogs, state.logs.length);
      if (newCount > 0) {
        const newLogs = state.logs.slice(-newCount);
        const fragment = document.createDocumentFragment();

        for (const logText of newLogs) {
          fragment.appendChild(createLogNode(logText));
        }

        logDiv.appendChild(fragment);

        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstElementChild);
        }

        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedTotalLogs = totalLogs;
      }
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.replaceChildren();
    const memoryEntries = Object.entries(state.memory || {});
    if (memoryEntries.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.textContent = 'No memory stored yet.';
      memoryDiv.appendChild(emptyItem);
    } else {
      const frag = document.createDocumentFragment();
      for (const [k, v] of memoryEntries) {
        const item = document.createElement('div');
        item.className = 'memory-item';

        const spanKey = document.createElement('span');
        spanKey.className = 'memory-key';
        spanKey.textContent = `${k}:`;

        item.appendChild(spanKey);
        item.appendChild(document.createTextNode(` ${v}`));
        frag.appendChild(item);
      }
      memoryDiv.appendChild(frag);
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
