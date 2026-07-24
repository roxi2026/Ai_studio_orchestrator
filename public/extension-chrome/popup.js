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
    
    if (state.goal && !goalInput.value) {
      goalInput.value = state.goal;
    }

    // Incremental log rendering
    if (state.logs) {
      const logContainerDefault = logDiv.innerHTML === '' || logDiv.innerHTML.includes('No logs yet');
      if (state.totalLogs < lastRenderedTotalLogs || logContainerDefault) {
        logDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      const newLogsCount = Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length);
      if (newLogsCount > 0) {
        const fragment = document.createDocumentFragment();
        const newEntries = state.logs.slice(state.logs.length - newLogsCount);

        newEntries.forEach(logText => {
          const entryDiv = document.createElement('div');
          entryDiv.appendChild(document.createTextNode('> ' + logText));
          fragment.appendChild(entryDiv);
        });

        logDiv.appendChild(fragment);
        lastRenderedTotalLogs = state.totalLogs;

        // Keep at most 50 elements in DOM
        while (logDiv.children.length > 50) {
          logDiv.removeChild(logDiv.firstChild);
        }

        logDiv.scrollTop = logDiv.scrollHeight;
      }
    }
    
    // Memory rendering (rendered statically as it changes infrequently and is small)
    if (state.memory) {
      const memoryEntries = Object.entries(state.memory);
      if (memoryEntries.length > 0) {
        const fragment = document.createDocumentFragment();
        memoryEntries.forEach(([k, v]) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'memory-item';

          const keySpan = document.createElement('span');
          keySpan.className = 'memory-key';
          keySpan.textContent = k + ':';

          itemDiv.appendChild(keySpan);
          itemDiv.appendChild(document.createTextNode(' ' + v));
          fragment.appendChild(itemDiv);
        });
        memoryDiv.innerHTML = '';
        memoryDiv.appendChild(fragment);
      } else {
        memoryDiv.innerHTML = '<div>No memory stored yet.</div>';
      }
    } else {
      memoryDiv.innerHTML = '<div>No memory stored yet.</div>';
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
