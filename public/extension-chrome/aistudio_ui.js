// aistudio_ui.js - In-page Command Center injected into AI Studio

(function() {
  if (document.getElementById('omnipotent-orchestrator-root')) return;

  // Create UI Container
  const root = document.createElement('div');
  root.id = 'omnipotent-orchestrator-root';
  
  root.innerHTML = `
    <div class="oo-minimized-icon" id="oo-maximize-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </div>
    <div class="oo-content-wrapper">
      <div class="oo-header">
        <div class="oo-title">
          <svg class="oo-title-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Central Command (CC)
        </div>
        <div class="oo-controls">
          <button class="oo-btn-icon" id="oo-minimize-btn" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          </button>
        </div>
      </div>
      <div class="oo-content">
        <div class="oo-input-group">
          <label class="oo-label">Strategic Objective</label>
          <textarea id="oo-goal-input" class="oo-textarea" placeholder="E.g., Research the latest AI news. Deploy puppet agents to extract text from tech blogs, summarize them, and start a new session for each summary..."></textarea>
        </div>
        <div class="oo-actions">
          <button id="oo-start-btn" class="oo-btn oo-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Initialize CC
          </button>
          <button id="oo-stop-btn" class="oo-btn oo-btn-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            Halt
          </button>
          <button id="oo-clear-mem-btn" class="oo-btn oo-btn-secondary" title="Clear Stored Memory">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        <div class="oo-input-group">
          <label class="oo-label">Live Telemetry</label>
          <div id="oo-logs" class="oo-logs">
            <div class="oo-log-entry"><span class="oo-log-time">System</span> Central Command (CC) ready and awaiting instructions.</div>
          </div>
        </div>
      </div>
      <div class="oo-status-bar">
        <div id="oo-status-dot" class="oo-status-dot"></div>
        <span id="oo-status-text">Standing by</span>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // UI Elements
  const minimizeBtn = document.getElementById('oo-minimize-btn');
  const maximizeBtn = document.getElementById('oo-maximize-btn');
  const startBtn = document.getElementById('oo-start-btn');
  const stopBtn = document.getElementById('oo-stop-btn');
  const clearMemBtn = document.getElementById('oo-clear-mem-btn');
  const goalInput = document.getElementById('oo-goal-input');
  const logsDiv = document.getElementById('oo-logs');
  const statusDot = document.getElementById('oo-status-dot');
  const statusText = document.getElementById('oo-status-text');

  // Toggle Logic
  minimizeBtn.addEventListener('click', () => root.classList.add('minimized'));
  maximizeBtn.addEventListener('click', () => root.classList.remove('minimized'));

  // State Management
  let lastRenderedTotalLogs = 0;

  function updateUI(state) {
    if (!state) return;
    
    statusText.textContent = state.status;
    statusDot.className = 'oo-status-dot';
    
    if (state.status === 'Running') {
      statusDot.classList.add('active');
    } else if (state.status === 'Error') {
      statusDot.classList.add('error');
    }

    if (state.goal && !goalInput.value) {
      goalInput.value = state.goal;
    }

    // Render Logs Incrementally O(1)
    if (state.logs) {
      // Handle state reset/restarts or out-of-sync
      if (state.totalLogs < lastRenderedTotalLogs) {
        logsDiv.innerHTML = '';
        lastRenderedTotalLogs = 0;
      }

      // Restore/populate from state.logs if the container is currently in its default state (empty or initial welcome)
      const isDefaultState = logsDiv.children.length === 0 ||
        (logsDiv.children.length === 1 && logsDiv.querySelector('.oo-log-entry')?.textContent.includes('Central Command (CC) ready'));

      if (isDefaultState && lastRenderedTotalLogs === 0 && state.logs.length > 0) {
        logsDiv.innerHTML = '';
        const fragment = document.createDocumentFragment();
        state.logs.forEach(l => {
          const entry = document.createElement('div');
          entry.className = 'oo-log-entry';

          // Pre-parsed message has timestamp inside it e.g. "[12:34:56] message"
          const match = l.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
          if (match) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'oo-log-time';
            timeSpan.textContent = match[1];
            entry.appendChild(timeSpan);
            entry.appendChild(document.createTextNode(' ' + match[2]));
          } else {
            entry.textContent = l;
          }
          fragment.appendChild(entry);
        });
        logsDiv.appendChild(fragment);
        lastRenderedTotalLogs = state.totalLogs;
        logsDiv.scrollTop = logsDiv.scrollHeight;
      } else if (state.totalLogs > lastRenderedTotalLogs) {
        // Calculate new logs to append
        const newLogsCount = Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length);
        if (newLogsCount > 0) {
          const newLogs = state.logs.slice(-newLogsCount);
          const fragment = document.createDocumentFragment();
          newLogs.forEach(l => {
            const entry = document.createElement('div');
            entry.className = 'oo-log-entry';

            const match = l.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
            if (match) {
              const timeSpan = document.createElement('span');
              timeSpan.className = 'oo-log-time';
              timeSpan.textContent = match[1];
              entry.appendChild(timeSpan);
              entry.appendChild(document.createTextNode(' ' + match[2]));
            } else {
              entry.textContent = l;
            }
            fragment.appendChild(entry);
          });
          logsDiv.appendChild(fragment);
          lastRenderedTotalLogs = state.totalLogs;

          // Limit DOM size to 50 elements to prevent layout/memory bloat
          while (logsDiv.children.length > 50) {
            logsDiv.removeChild(logsDiv.firstChild);
          }

          logsDiv.scrollTop = logsDiv.scrollHeight;
        }
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

  // Listen for direct messages
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'AUTO_ACTIVATE') {
      root.classList.remove('minimized');
      if (msg.state) updateUI(msg.state);
      
      // Append welcome log incrementally
      const entry = document.createElement('div');
      entry.className = 'oo-log-entry';
      const timeSpan = document.createElement('span');
      timeSpan.className = 'oo-log-time';
      timeSpan.textContent = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      entry.appendChild(timeSpan);
      entry.appendChild(document.createTextNode(' Auto-activated upon entering AI Studio.'));
      logsDiv.appendChild(entry);

      while (logsDiv.children.length > 50) {
        logsDiv.removeChild(logsDiv.firstChild);
      }
      logsDiv.scrollTop = logsDiv.scrollHeight;
    } else if (msg.action === 'CLEAR_LOGS') {
      logsDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }
  });

  // Actions
  startBtn.addEventListener('click', () => {
    const goal = goalInput.value.trim();
    if (!goal) {
      goalInput.style.borderColor = '#ef4444';
      setTimeout(() => goalInput.style.borderColor = 'rgba(255, 255, 255, 0.1)', 1000);
      return;
    }
    chrome.runtime.sendMessage({ action: 'START_ORCHESTRATION', goal });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ORCHESTRATION' });
  });

  clearMemBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'CLEAR_MEMORY' });
    logsDiv.innerHTML += `<div class="oo-log-entry"><span class="oo-log-time">System</span> Memory cleared.</div>`;
    logsDiv.scrollTop = logsDiv.scrollHeight;
  });

  // Auto-activate on load
  setTimeout(() => {
    root.classList.remove('minimized');
  }, 500);

})();
