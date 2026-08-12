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

  // Monotonic tracking for O(1) rendering
  let lastRenderedTotalLogs = 0;

  // Helper to safely parse and create a single log DOM element with XSS protection
  function createLogElement(l) {
    const row = document.createElement('div');
    row.className = 'oo-log-entry';

    // Parse HH:MM:SS timestamp from natively prepended brackets, e.g. "[12:34:56] message"
    const tsMatch = l.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
    if (tsMatch) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'oo-log-time';
      timeSpan.textContent = tsMatch[1];
      row.appendChild(timeSpan);
      row.appendChild(document.createTextNode(' ' + tsMatch[2]));
    } else {
      // Fallback if no bracketed timestamp is found (e.g. system messages)
      row.textContent = l;
    }
    return row;
  }

  // O(1) Incremental Rendering function using DocumentFragment and Text Nodes
  function appendLogsIncremental(logs, totalLogs) {
    if (!logs || logs.length === 0) return;

    // 1. Evaluate state resets or clears (state.totalLogs < lastRenderedTotalLogs)
    if (totalLogs < lastRenderedTotalLogs) {
      logsDiv.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    // 2. Initial log history restoration check
    const isDefaultState = logsDiv.children.length <= 1 &&
      (logsDiv.children.length === 0 || logsDiv.firstElementChild.textContent.includes('ready'));

    if (isDefaultState && lastRenderedTotalLogs === 0) {
      logsDiv.innerHTML = ''; // clear default welcome message
      const fragment = document.createDocumentFragment();
      logs.forEach(l => {
        const row = createLogElement(l);
        fragment.appendChild(row);
      });
      logsDiv.appendChild(fragment);
      lastRenderedTotalLogs = totalLogs;
      logsDiv.scrollTop = logsDiv.scrollHeight;
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
        logsDiv.appendChild(fragment);
        lastRenderedTotalLogs = totalLogs;
      }
    }

    // 4. Strict 50-entry cap to prevent layout reflow degradation and memory bloat
    while (logsDiv.children.length > 50) {
      logsDiv.removeChild(logsDiv.firstChild);
    }

    // 5. Batch the scroll operation once after the incremental append loop
    logsDiv.scrollTop = logsDiv.scrollHeight;
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

    // Render Logs Incrementally
    if (state.logs) {
      appendLogsIncremental(state.logs, state.totalLogs || state.logs.length);
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

  // Listen for direct messages (like auto-activate or direct log broadcasts)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'AUTO_ACTIVATE') {
      root.classList.remove('minimized');
      if (msg.state) updateUI(msg.state);
      
      // Add a welcome log safely
      const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const welcomeLog = `[${timeStr}] System: Auto-activated upon entering AI Studio.`;
      appendLogsIncremental([welcomeLog], lastRenderedTotalLogs + 1);
    } else if (msg.action === 'NEW_LOG') {
      appendLogsIncremental(msg.logs || [msg.message], msg.totalLogs);
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
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clearedLog = `[${timeStr}] System: Memory cleared.`;
    appendLogsIncremental([clearedLog], lastRenderedTotalLogs + 1);
  });

  // Auto-activate on load
  setTimeout(() => {
    root.classList.remove('minimized');
  }, 500);

})();
