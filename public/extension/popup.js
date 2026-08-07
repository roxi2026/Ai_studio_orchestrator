document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Local cache for O(1) incremental rendering
  let lastRenderedTotalLogs = 0;

  function createLogElement(logText) {
    const div = document.createElement('div');

    // Parse timestamp if it is natively prepended in brackets [HH:MM:SS]
    const match = logText.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
    if (match) {
      const prefixNode = document.createTextNode('> ');
      div.appendChild(prefixNode);
      const timeSpan = document.createElement('span');
      timeSpan.style.color = '#1a73e8';
      timeSpan.textContent = `[${match[1]}]`;
      div.appendChild(timeSpan);
      div.appendChild(document.createTextNode(' ' + match[2]));
    } else {
      div.appendChild(document.createTextNode('> ' + logText));
    }
    return div;
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
    
    // Incremental Render Logs
    const totalLogs = state.totalLogs || 0;
    const logs = state.logs || [];

    // 1. Detect and handle state resets (e.g. orchestrator restarted or logs cleared)
    if (totalLogs < lastRenderedTotalLogs || totalLogs === 0) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    // 2. Check if the container is empty (default state) and we have initial logs to populate
    const isEmpty = logDiv.children.length === 0;

    if (isEmpty && logs.length > 0) {
      logDiv.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (const logText of logs) {
        fragment.appendChild(createLogElement(logText));
      }
      logDiv.appendChild(fragment);
      lastRenderedTotalLogs = totalLogs;
      logDiv.scrollTop = logDiv.scrollHeight;
    }
    // 3. Otherwise perform incremental rendering
    else if (totalLogs > lastRenderedTotalLogs) {
      const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, logs.length);
      if (newLogsCount > 0) {
        const newLogs = logs.slice(logs.length - newLogsCount);
        const fragment = document.createDocumentFragment();
        for (const logText of newLogs) {
          fragment.appendChild(createLogElement(logText));
        }
        logDiv.appendChild(fragment);

        // Maintain 50-entry cap in the DOM to avoid memory leak and layout thrashing
        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        lastRenderedTotalLogs = totalLogs;
        logDiv.scrollTop = logDiv.scrollHeight;
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
