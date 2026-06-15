document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  /**
   * Appends a single log entry to the DOM.
   * @param {string|object} log
   * @param {boolean} skipScroll
   */
  function appendLog(log, skipScroll = false) {
    const entry = document.createElement('div');
    const text = typeof log === 'object' ? log.text : log;
    entry.textContent = `> ${text}`;
    logDiv.appendChild(entry);

    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    if (!skipScroll) logDiv.scrollTop = logDiv.scrollHeight;
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
    
    // Incremental Log Rendering
    if (state.logs && state.logs.length > 0) {
      const currentCount = logDiv.children.length;

      if (currentCount === 0) {
        logDiv.innerHTML = '';
        state.logs.forEach((l, i) => appendLog(l, i < state.logs.length - 1));
      } else {
        const lastRenderedText = logDiv.lastChild.textContent.replace(/^> /, '');
        let foundIdx = -1;
        for (let i = state.logs.length - 1; i >= 0; i--) {
          const txt = typeof state.logs[i] === 'object' ? state.logs[i].text : state.logs[i];
          if (txt === lastRenderedText) {
            foundIdx = i;
            break;
          }
        }

        if (foundIdx === -1) {
          logDiv.innerHTML = '';
          state.logs.forEach((l, i) => appendLog(l, i < state.logs.length - 1));
        } else {
          for (let i = foundIdx + 1; i < state.logs.length; i++) {
            appendLog(state.logs[i]);
          }
        }
      }
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

  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) return;
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });
});
