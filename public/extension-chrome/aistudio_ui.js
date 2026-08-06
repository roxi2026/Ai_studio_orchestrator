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

  // Monotonic tracking for incremental UI rendering
  let lastRenderedTotalLogs = 0;

  // Function to check and clear welcome/ready messages before populating logs
  function ensureClearedForLogs() {
    const defaultTexts = [
      'central command (cc) ready and awaiting instructions.',
      'auto-activated upon entering ai studio.',
      'memory cleared.'
    ];
    // Check if the container only has a single child that matches a default text
    if (logsDiv.children.length === 1) {
      const text = logsDiv.children[0].textContent.toLowerCase();
      if (defaultTexts.some(defaultText => text.includes(defaultText))) {
        logsDiv.textContent = '';
      }
    }
  }

  // State Management
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

    // O(1) Incremental Rendering of Logs
    const currentTotalLogs = state.totalLogs || 0;

    // Check for a reset/restart state
    if (currentTotalLogs < lastRenderedTotalLogs) {
      logsDiv.textContent = '';
      lastRenderedTotalLogs = 0;
    }

    if (state.logs && state.logs.length > 0 && currentTotalLogs > lastRenderedTotalLogs) {
      ensureClearedForLogs();

      // Calculate how many new entries are present
      const newLogsCount = Math.min(currentTotalLogs - lastRenderedTotalLogs, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      const fragment = document.createDocumentFragment();

      newLogs.forEach(logMessage => {
        const entry = document.createElement('div');
        entry.className = 'oo-log-entry';

        // Extract native timestamp from logMessage if present (e.g. [HH:MM:SS] message)
        const timestampMatch = logMessage.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)/);
        let timeText = '';
        let messageBody = logMessage;

        if (timestampMatch) {
          timeText = timestampMatch[1];
          messageBody = timestampMatch[2];
        } else {
          timeText = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'oo-log-time';
        timeSpan.textContent = timeText;
        entry.appendChild(timeSpan);
        entry.appendChild(document.createTextNode(' ' + messageBody));

        fragment.appendChild(entry);
      });

      // Append DocumentFragment to container to trigger exactly 1 layout/reflow
      logsDiv.appendChild(fragment);
      lastRenderedTotalLogs = currentTotalLogs;

      // Keep strict 50-entry cap
      while (logsDiv.children.length > 50) {
        logsDiv.removeChild(logsDiv.firstChild);
      }

      // Batch the scroll operation to scrollTop = scrollHeight once
      logsDiv.scrollTop = logsDiv.scrollHeight;
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
      
      // Add a welcome log (only if the container is currently empty)
      if (logsDiv.children.length === 0) {
        const entry = document.createElement('div');
        entry.className = 'oo-log-entry';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'oo-log-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.appendChild(timeSpan);
        entry.appendChild(document.createTextNode(' Auto-activated upon entering AI Studio.'));
        logsDiv.appendChild(entry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
      }
    } else if (msg.action === 'CLEAR_LOGS') {
      logsDiv.textContent = '';
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
