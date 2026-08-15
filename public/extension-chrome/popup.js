document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastLogsLength = 0;
  let lastMemoryString = '';

  function updateUI(state) {
    if (!state) return;

    if (statusDiv.textContent !== state.status) {
      statusDiv.textContent = state.status;
      if (state.status === 'Running') {
        statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
      } else if (state.status === 'Error') {
        statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
      } else {
        statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
      }
    }
    
    // Incremental log rendering using DocumentFragment
    const logs = state.logs || [];
    if (logs.length < lastLogsLength) {
      logDiv.textContent = '';
      lastLogsLength = 0;
    }

    if (logs.length > lastLogsLength) {
      const fragment = document.createDocumentFragment();
      for (let i = lastLogsLength; i < logs.length; i++) {
        const item = document.createElement('div');
        item.textContent = `> ${logs[i]}`;
        fragment.appendChild(item);
      }
      logDiv.appendChild(fragment);
      lastLogsLength = logs.length;
      logDiv.scrollTop = logDiv.scrollHeight;
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    // Memory rendering (memoized update)
    const memoryObj = state.memory || {};
    const memStr = JSON.stringify(memoryObj);
    if (memStr !== lastMemoryString) {
      lastMemoryString = memStr;
      const entries = Object.entries(memoryObj);
      if (entries.length === 0) {
        memoryDiv.textContent = 'No memory stored yet.';
      } else {
        const fragment = document.createDocumentFragment();
        entries.forEach(([k, v]) => {
          const item = document.createElement('div');
          item.className = 'memory-item';
          const span = document.createElement('span');
          span.className = 'memory-key';
          span.textContent = `${k}:`;
          item.appendChild(span);
          item.appendChild(document.createTextNode(` ${v}`));
          fragment.appendChild(item);
        });
        memoryDiv.replaceChildren(fragment);
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

  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) return;
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });
});
