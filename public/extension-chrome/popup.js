document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  function appendLog(logEntry) {
    const entry = document.createElement('div');
    const text = typeof logEntry === 'object' ? logEntry.text : logEntry;
    entry.textContent = `> ${text}`;
    logDiv.appendChild(entry);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }
    logDiv.scrollTop = logDiv.scrollHeight;
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
    
    // Optimization: Only re-render logs if necessary (e.g. initial load)
    if (state.logs && state.logs.length > 0 && logDiv.children.length === 0) {
      state.logs.forEach(l => appendLog(l));
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
      const newState = changes.orchestratorState.newValue;
      const oldState = changes.orchestratorState.oldValue;

      updateUI(newState);

      // Incremental log updates if available
      // Background script debounces writes, so multiple logs may arrive at once.
      const oldLen = oldState?.logs?.length || 0;
      const newLen = newState.logs.length;

      if (newLen > oldLen && logDiv.children.length > 0) {
        // Only append the NEW entries
        const newEntries = newState.logs.slice(oldLen);
        newEntries.forEach(l => appendLog(l));
      }
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
