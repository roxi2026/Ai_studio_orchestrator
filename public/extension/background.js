// background.js - Omnipotent Orchestrator Service Worker

// --- Keep-Alive Mechanism (Offscreen Document) ---
async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });
  if (existingContexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: 'Keep service worker running for long-running orchestration tasks.'
  });
}
chrome.runtime.onStartup.addListener(setupOffscreenDocument);
chrome.runtime.onInstalled.addListener(setupOffscreenDocument);

// --- State Management ---
let state = {
  status: 'Idle', // Idle, Planning, Executing, Completed, Error
  goal: '',
  plan: [],
  currentStepIndex: 0,
  memory: {},
  logs: [],
  totalLogs: 0,
  brainTabId: null,
  targetTabId: null,
  pendingPrompt: null
};

function log(message) {
  const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedMessage = `[${timeStr}] ${message}`;
  console.log(`[Orchestrator] ${formattedMessage}`);
  state.logs.push(formattedMessage);
  if (state.logs.length > 50) state.logs.shift();
  state.totalLogs = (state.totalLogs || 0) + 1;
  saveState();
}

function saveState() {
  chrome.storage.local.set({ orchestratorState: state });
}

chrome.storage.local.get(['orchestratorState'], (result) => {
  if (result.orchestratorState) {
    state = result.orchestratorState;
    if (state.totalLogs === undefined) {
      state.totalLogs = state.logs ? state.logs.length : 0;
    }
  }
});

// Helper to broadcast messages to both popups and active tabs
async function broadcastToAIStudio(message) {
  chrome.runtime.sendMessage(message, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });

  try {
    const tabs = await chrome.tabs.query({ url: 'https://aistudio.google.com/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    }
  } catch (e) {
    // Ignore errors querying tabs
  }
}

// --- Auto-Activation & Session Handoff ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('aistudio.google.com')) {
    state.brainTabId = tabId;
    saveState();
    
    // Auto-activate the in-page UI
    chrome.tabs.sendMessage(tabId, { action: 'AUTO_ACTIVATE', state });

    // Handle Session Handoff Injection
    if (state.pendingPrompt) {
      const prompt = state.pendingPrompt;
      state.pendingPrompt = null;
      saveState();
      
      log('Session handoff complete. Injecting prompt in 3 seconds...');
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'SEND_PROMPT', text: prompt });
      }, 3000); // Wait for React to mount chat interface
    }
  }
});

// --- Orchestration Engine ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KEEPALIVE') return;
  if (message.action === 'START_ORCHESTRATION') startOrchestration(message.goal);
  if (message.action === 'STOP_ORCHESTRATION') {
    state.status = 'Idle';
    state.pendingPrompt = null;
    log('Orchestration stopped by user.');
    saveState();
  }
  if (message.action === 'MODEL_OUTPUT_COMPLETE') handleModelOutput(message.text);
});

async function startOrchestration(goal) {
  state.goal = goal;
  state.status = 'Planning';
  state.plan = [];
  state.currentStepIndex = 0;
  state.memory = {};
  state.logs = [];
  state.totalLogs = 0;
  saveState();

  // Broadcast UI clear signal to popups and injected scripts
  broadcastToAIStudio({ action: 'CLEAR_LOGS' });

  log('Phase 1: Meta-Planning initialized...');
  
  const tabs = await chrome.tabs.query({ url: 'https://aistudio.google.com/*' });
  if (tabs.length === 0) {
    log('Error: AI Studio tab not found.');
    state.status = 'Error';
    saveState();
    return;
  }
  
  state.brainTabId = tabs[0].id;
  
  const prompt = `You are an Omnipotent Web Agent Planner.
User Goal: ${goal}
Create a step-by-step execution plan to achieve this goal.
Output ONLY a JSON array of steps wrapped in <PLAN> tags.
Each step must have a "description".
Example:
<PLAN>
[
  {"description": "Navigate to Wikipedia and search for Quantum Computing"},
  {"description": "Read the first paragraph and STORE it in memory"}
]
</PLAN>`;
  
  state.pendingPrompt = prompt;
  saveState();
  
  // Trigger fresh session for planning
  chrome.tabs.update(state.brainTabId, { url: 'https://aistudio.google.com/app/prompts/new_chat' });
}

function executeCurrentStep() {
  const step = state.plan[state.currentStepIndex];
  log(`Phase 2: Handoff to new session for Step ${state.currentStepIndex + 1}: ${step.description}`);

  const prompt = `You are an Omnipotent Web Agent Executor.
Overall Goal: ${state.goal}
Current Step: ${step.description}
Memory from previous steps: ${JSON.stringify(state.memory)}

Output a JSON object wrapped in <ACTION> tags to interact with the browser.
Available actions:
{"type": "NAVIGATE", "url": "https://..."}
{"type": "CLICK", "selector": "css or xpath"}
{"type": "TYPE", "selector": "css or xpath", "text": "text"}
{"type": "READ", "selector": "css or xpath"}
{"type": "EVALUATE", "script": "javascript code"}
{"type": "STORE", "key": "key", "value": "data"}
{"type": "STEP_DONE", "message": "summary of what was done"}

Wait for System Result after each <ACTION>. When the step is complete, output <ACTION>{"type": "STEP_DONE", "message": "..."}</ACTION>.`;

  state.pendingPrompt = prompt;
  saveState();
  
  // Trigger session handoff to clear context and avoid rate limits
  chrome.tabs.update(state.brainTabId, { url: 'https://aistudio.google.com/app/prompts/new_chat' });
}

async function handleModelOutput(text) {
  if (state.status === 'Planning') {
    const match = text.match(/<PLAN>([\s\S]*?)<\/PLAN>/);
    if (match) {
      try {
        state.plan = JSON.parse(match[1].trim());
        state.status = 'Executing';
        log(`Plan created with ${state.plan.length} steps. Starting execution...`);
        saveState();
        executeCurrentStep();
      } catch (e) {
        log('Failed to parse plan JSON. Retrying...');
        chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System Error: Invalid JSON in <PLAN>. Please output valid JSON array.' });
      }
    } else {
       chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System Error: No <PLAN> tags found. Please output the plan.' });
    }
    return;
  }

  if (state.status === 'Executing') {
    const match = text.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
    if (!match) {
      log('No action found. Prompting model to continue.');
      chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System: No <ACTION> tag found. Please provide your next action.' });
      return;
    }
    
    try {
      const action = JSON.parse(match[1].trim());
      log(`Executing: ${action.type}`);
      
      if (action.type === 'STEP_DONE') {
        log(`Step ${state.currentStepIndex + 1} completed: ${action.message}`);
        state.currentStepIndex++;
        saveState();
        
        if (state.currentStepIndex >= state.plan.length) {
          state.status = 'Completed';
          log('All steps completed successfully!');
          saveState();
        } else {
          log('Rate limit buffer: waiting 5 seconds before next session handoff...');
          setTimeout(() => {
            executeCurrentStep();
          }, 5000);
        }
        return;
      }
      
      if (action.type === 'STORE') {
        state.memory[action.key] = action.value;
        saveState();
        chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Result: Stored ${action.key} in memory.` });
        return;
      }
      
      if (action.type === 'NAVIGATE') {
        if (state.targetTabId) {
          chrome.tabs.update(state.targetTabId, { url: action.url }, (tab) => {
            setTimeout(() => {
              chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Result: Navigated to ${action.url}` });
            }, 3000); // Wait for page load
          });
        } else {
          chrome.tabs.create({ url: action.url, active: false }, (tab) => {
            state.targetTabId = tab.id;
            setTimeout(() => {
              chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Result: Opened new tab and navigated to ${action.url}` });
            }, 3000);
          });
        }
        return;
      }
      
      // DOM Actions
      if (!state.targetTabId) {
        chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Error: No target tab open. Use NAVIGATE first.` });
        return;
      }
      
      chrome.tabs.sendMessage(state.targetTabId, { action: 'EXECUTE_DOM', cmd: action }, (response) => {
        if (chrome.runtime.lastError) {
           chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Error: ${chrome.runtime.lastError.message}` });
        } else {
           chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Result: ${response.result}` });
        }
      });
      
    } catch (e) {
      log(`Parse/Execution error: ${e.message}`);
      chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: `System Error: Invalid JSON or execution failed. ${e.message}` });
    }
  }
}
