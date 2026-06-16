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
          God Mode Orchestrator
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
          <textarea id="oo-goal-input" class="oo-textarea" placeholder="E.g., Navigate to Wikipedia, search for 'Quantum Computing', and extract the first paragraph..."></textarea>
        </div>
        <div class="oo-actions">
          <button id="oo-start-btn" class="oo-btn oo-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Initialize Agent
          </button>
          <button id="oo-stop-btn" class="oo-btn oo-btn-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            Halt
          </button>
        </div>
        
        <div class="oo-input-group">
          <label class="oo-label">Execution Plan</label>
          <div id="oo-plan" class="oo-plan-container">
            <div class="oo-plan-step">Awaiting meta-planning...</div>
          </div>
        </div>

        <div class="oo-input-group">
          <label class="oo-label">Live Telemetry</label>
          <div id="oo-logs" class="oo-logs">
            <div class="oo-log-entry"><span class="oo-log-time">System</span> Agent ready and awaiting instructions.</div>
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
  const goalInput = document.getElementById('oo-goal-input');
  const logsDiv = document.getElementById('oo-logs');
  const planDiv = document.getElementById('oo-plan');
  const statusDot = document.getElementById('oo-status-dot');
  const statusText = document.getElementById('oo-status-text');

  // Toggle Logic
  minimizeBtn.addEventListener('click', () => root.classList.add('minimized'));
  maximizeBtn.addEventListener('click', () => root.classList.remove('minimized'));

  // Performance-optimized incremental log rendering
  function appendLog(logEntry, skipScroll = false) {
    const text = typeof logEntry === 'string' ? logEntry : logEntry.text;
    const timestamp = typeof logEntry === 'string' ? Date.now() : logEntry.timestamp;

    const entryDiv = document.createElement('div');
    entryDiv.className = 'oo-log-entry';
    entryDiv.dataset.timestamp = timestamp;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'oo-log-time';
    timeSpan.textContent = new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

    entryDiv.appendChild(timeSpan);
    entryDiv.appendChild(document.createTextNode(' ' + text));
    logsDiv.appendChild(entryDiv);

    while (logsDiv.children.length > 50) {
      logsDiv.removeChild(logsDiv.firstChild);
    }

    if (!skipScroll) {
      logsDiv.scrollTop = logsDiv.scrollHeight;
    }
  }

  // State Management
  function updateUI(state) {
    if (!state) return;
    
    statusText.textContent = state.status;
    statusDot.className = 'oo-status-dot';
    
    if (state.status === 'Executing') {
      statusDot.classList.add('active');
    } else if (state.status === 'Planning') {
      statusDot.classList.add('planning');
    } else if (state.status === 'Error') {
      statusDot.classList.add('error');
    }

    if (state.goal && !goalInput.value) {
      goalInput.value = state.goal;
    }

    // Render Plan
    if (state.plan && state.plan.length > 0) {
      planDiv.innerHTML = state.plan.map((step, i) => {
        let icon = '⏳';
        let className = 'oo-plan-step';
        if (i < state.currentStepIndex) {
          icon = '✅';
          className += ' completed';
        } else if (i === state.currentStepIndex && state.status === 'Executing') {
          icon = '▶️';
          className += ' active';
        }
        return `<div class="${className}"><span>${icon}</span> <span>Step ${i+1}: ${step.description}</span></div>`;
      }).join('');
    } else {
      planDiv.innerHTML = '<div class="oo-plan-step">Awaiting meta-planning...</div>';
    }

    // Render Logs - Incremental update for O(1) performance
    const logs = state.logs || [];
    if (logs.length === 0) {
      logsDiv.innerHTML = '';
    } else {
      const lastEntry = logs[logs.length - 1];
      const lastTimestamp = typeof lastEntry === 'string' ? null : String(lastEntry.timestamp);
      const currentLastTimestamp = logsDiv.lastChild ? logsDiv.lastChild.dataset.timestamp : null;

      const isDefault = logsDiv.children.length <= 1 && (logsDiv.innerText.includes('ready') || logsDiv.innerText === '');

      if (isDefault || lastTimestamp !== currentLastTimestamp) {
        let matchIdx = -1;
        if (currentLastTimestamp) {
          for (let i = logs.length - 1; i >= 0; i--) {
            if (String(logs[i].timestamp) === currentLastTimestamp) {
              matchIdx = i;
              break;
            }
          }
        }

        if (matchIdx !== -1) {
          for (let i = matchIdx + 1; i < logs.length; i++) {
            appendLog(logs[i], i < logs.length - 1);
          }
        } else {
          logsDiv.innerHTML = '';
          logs.forEach((l, i) => appendLog(l, i < logs.length - 1));
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

  // Listen for direct messages (like auto-activate)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'AUTO_ACTIVATE') {
      root.classList.remove('minimized');
      if (msg.state) updateUI(msg.state);
      
      // Add a welcome log
      appendLog({ text: 'Auto-activated upon entering AI Studio.', timestamp: Date.now() });
    }
    if (msg.action === 'CLEAR_LOGS') {
      logsDiv.innerHTML = '';
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

  // Auto-activate on load
  setTimeout(() => {
    root.classList.remove('minimized');
  }, 500);

})();
