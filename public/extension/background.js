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
  status: 'Idle',
  goal: '',
  logs: [],
  memory: {},
  brainTabId: null,
  targetTabId: null
};

function log(message) {
  console.log(`[Orchestrator] ${message}`);
  state.logs.push(message);
  if (state.logs.length > 50) state.logs.shift();
  saveState();
}

function saveState() {
  chrome.storage.local.set({ orchestratorState: state });
}

chrome.storage.local.get(['orchestratorState'], (result) => {
  if (result.orchestratorState) state = result.orchestratorState;
});

// --- Orchestration Engine ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KEEPALIVE') return;
  if (message.action === 'START_ORCHESTRATION') startOrchestration(message.goal);
  if (message.action === 'STOP_ORCHESTRATION') {
    state.status = 'Idle';
    log('Orchestration stopped by user.');
    saveState();
  }
  if (message.action === 'MODEL_OUTPUT_COMPLETE') handleModelOutput(message.text);
});

async function startOrchestration(goal) {
  state.goal = goal;
  state.status = 'Running';
  state.logs = [];
  state.memory = {};
  log('Starting universal orchestration...');
  
  const tabs = await chrome.tabs.query({ url: 'https://aistudio.google.com/*' });
  if (tabs.length === 0) {
    log('Error: AI Studio tab not found. Please open https://aistudio.google.com/');
    state.status = 'Error';
    saveState();
    return;
  }
  
  state.brainTabId = tabs[0].id;
  
  const prompt = `You are an Omnipotent Web Agent. Your goal is: ${goal}.
You control a browser. Output a JSON object wrapped in <ACTION> tags to take action.
Wait for the System Result before outputting the next action.

Available actions:
{"type": "NAVIGATE", "url": "https://..."}
{"type": "CLICK", "selector": "css or xpath"}
{"type": "TYPE", "selector": "css or xpath", "text": "text"}
{"type": "READ", "selector": "css or xpath"}
{"type": "EVALUATE", "script": "javascript code"}
{"type": "STORE", "key": "key", "value": "data"}
{"type": "DONE", "result": "final output"}

Example:
<ACTION>
{"type": "NAVIGATE", "url": "https://en.wikipedia.org"}
</ACTION>

Begin.`;
  
  chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: prompt });
}

async function handleModelOutput(text) {
  if (state.status !== 'Running') return;
  log('Received model output. Parsing...');
  
  const match = text.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
  if (!match) {
    log('No action found. Prompting model to continue.');
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System: No <ACTION> tag found. Please provide your next action.' });
    return;
  }
  
  try {
    const action = JSON.parse(match[1].trim());
    log(`Executing: ${action.type}`);
    
    if (action.type === 'DONE') {
      state.status = 'Completed';
      log(`Workflow finished: ${action.result}`);
      saveState();
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
