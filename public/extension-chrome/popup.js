document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  let lastRenderedLogCount = 0;

  function updateUI(state) {
    statusDiv.textContent = state.status;
    if (state.status === 'Running') {
        statusDiv.style.background = '#e6f4ea'; statusDiv.style.color = '#137333';
    } else if (state.status === 'Error') {
        statusDiv.style.background = '#fce8e6'; statusDiv.style.color = '#c5221f';
    } else {
        statusDiv.style.background = '#e8f0fe'; statusDiv.style.color = '#1967d2';
    }
    
    // Incremental Log Rendering Optimization
    if (state.logs && state.logs.length > 0) {
      if (state.logs.length < lastRenderedLogCount) {
        logDiv.innerHTML = '';
        lastRenderedLogCount = 0;
      }

      const newLogs = state.logs.slice(lastRenderedLogCount);
      if (newLogs.length > 0) {
        const fragment = document.createDocumentFragment();
        newLogs.forEach(l => {
          const entry = document.createElement('div');
          entry.textContent = `> ${l}`;
          fragment.appendChild(entry);
        });
        logDiv.appendChild(fragment);
        logDiv.scrollTop = logDiv.scrollHeight;
        lastRenderedLogCount = state.logs.length;
      }
    }
    
    if (state.goal && !goalInput.value) goalInput.value = state.goal;
    
    memoryDiv.innerHTML = Object.entries(state.memory || {}).map(([k, v]) => {
      const item = document.createElement('div');
      item.className = 'memory-item';
      const keySpan = document.createElement('span');
      keySpan.className = 'memory-key';
      keySpan.textContent = `${k}: `;
      item.appendChild(keySpan);
      item.appendChild(document.createTextNode(v));
      return item.outerHTML;
    }).join('') || '<div>No memory stored yet.</div>';
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
