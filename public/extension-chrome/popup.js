document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const goalInput = document.getElementById('goalInput');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const memoryDiv = document.getElementById('memory');

  // Monotonic tracking for O(1) rendering
  let lastRenderedTotalLogs = 0;

  // Helper to safely parse and create a single log DOM element with XSS protection
  function createLogElement(l) {
    const row = document.createElement('div');

    // Parse HH:MM:SS timestamp from natively prepended brackets, e.g. "[12:34:56] message"
    const tsMatch = l.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
    if (tsMatch) {
      row.textContent = `> [${tsMatch[1]}] ${tsMatch[2]}`;
    } else {
      // Fallback
      row.textContent = `> ${l}`;
    }
    return row;
  }

  // O(1) Incremental Rendering function using DocumentFragment and Text Nodes
  function appendLogsIncremental(logs, totalLogs) {
    if (!logs) return;

    // 1. Evaluate state resets or clears (state.totalLogs < lastRenderedTotalLogs)
    if (totalLogs < lastRenderedTotalLogs) {
      logDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    // 2. Initial log history restoration check
    const isDefaultState = logDiv.children.length === 0;

    if (isDefaultState && lastRenderedTotalLogs === 0) {
      const fragment = document.createDocumentFragment();
      logs.forEach(l => {
        const row = createLogElement(l);
        fragment.appendChild(row);
      });
      logDiv.appendChild(fragment);
      lastRenderedTotalLogs = totalLogs;
      logDiv.scrollTop = logDiv.scrollHeight;
      return;
    }

    // 3. Incremental updates comparing monotonic totalLogs with lastRenderedTotalLogs
    if (totalLogs > lastRenderedTotalLogs) {
      const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, logs.length);
      if (newLogsCount > 0) {
        const sliceStart = logs.length - newLogsCount;
        const newLogs = logs.slice(sliceStart);

        const fragment = document.createDocumentFragment();
        newLogs.forEach(l => {
          const row = createLogElement(l);
          fragment.appendChild(row);
        });

        // Append all new elements in a single DOM manipulation to minimize reflows
        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = totalLogs;
      }
    }

    // 4. Strict 50-entry cap to prevent layout reflow degradation and memory bloat
    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.firstChild);
    }

    // 5. Batch the scroll operation once after the incremental append loop
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
    
    // Render logs incrementally
    if (state.logs) {
      appendLogsIncremental(state.logs, state.totalLogs || state.logs.length);
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

  // Handle direct log messages and broadcasts
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'NEW_LOG') {
      appendLogsIncremental(msg.logs || [msg.message], msg.totalLogs);
    } else if (msg.action === 'CLEAR_LOGS') {
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
