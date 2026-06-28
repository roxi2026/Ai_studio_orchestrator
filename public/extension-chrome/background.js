// background.js - Omnipotent Orchestrator Service Worker (Central Command - CC)

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
  status: 'Idle', // Idle, Running, Completed, Error
  goal: '',
  memory: {},
  logs: [],
  totalLogs: 0, // Monotonic counter for incremental UI rendering
  brainTabId: null,
  puppetTabId: null,
  pendingPrompt: null
};

function log(message) {
  console.log(`[CC] ${message}`);
  state.logs.push(message);
  state.totalLogs++; // Increment total logs for O(1) UI updates
  if (state.logs.length > 50) state.logs.shift();
  saveState();
}

// Optimization: Debounced state persistence to minimize disk I/O
let saveTimeout = null;
function saveState(immediate = false) {
  if (immediate) {
    if (saveTimeout) clearTimeout(saveTimeout);
    chrome.storage.local.set({ orchestratorState: state });
    saveTimeout = null;
    return;
  }

  if (saveTimeout) return;

  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({ orchestratorState: state });
    saveTimeout = null;
  }, 500); // 500ms debounce
}

chrome.storage.local.get(['orchestratorState'], (result) => {
  if (result.orchestratorState) {
    state = { ...state, ...result.orchestratorState };
  }
});

// Broadcast state to all listeners (popup, in-page UI)
function broadcastToAIStudio(msg) {
  // Broadcast to extension popups
  chrome.runtime.sendMessage(msg).catch(() => {});
  // Broadcast to active AI Studio tabs
  chrome.tabs.query({ url: 'https://aistudio.google.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
    });
  });
}

// --- Auto-Activation & Session Handoff ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('aistudio.google.com')) {
    state.brainTabId = tabId;
    saveState(true); // Immediate save for tab ID
    
    // Auto-activate the in-page UI
    chrome.tabs.sendMessage(tabId, { action: 'AUTO_ACTIVATE', state });

    // Handle Session Handoff Injection
    if (state.pendingPrompt) {
      const prompt = state.pendingPrompt;
      state.pendingPrompt = null;
      saveState(true);
      
      log('Session handoff complete. Injecting prompt in 3 seconds...');
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'SEND_PROMPT', text: prompt });
      }, 3000); // Wait for React to mount chat interface
    }
  }
});

// --- Central Command (CC) Engine ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KEEPALIVE') return;
  if (message.action === 'START_ORCHESTRATION') startOrchestration(message.goal);
  if (message.action === 'STOP_ORCHESTRATION') {
    state.status = 'Idle';
    state.pendingPrompt = null;
    log('Orchestration stopped by user.');
    saveState(true);
  }
  if (message.action === 'CLEAR_MEMORY') {
    state.memory = {};
    log('Memory cleared by user.');
    saveState(true);
  }
  if (message.action === 'MODEL_OUTPUT_COMPLETE') handleModelOutput(message.text);
  
  if (message.action === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 50 }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true; // Keep channel open for async response
  }
});

async function startOrchestration(goal) {
  state.goal = goal;
  state.status = 'Running';
  state.memory = {};
  state.logs = [];
  state.totalLogs = 0; // Reset counter for new session
  
  // Send broadcast to reset UI logs immediately
  broadcastToAIStudio({ action: 'CLEAR_LOGS' });
  
  log('Initializing Central Command (CC)...');
  
  const prompt = `You are the Central Command (CC) of an autonomous multi-agent system. Your goal is: "${goal}"

You have access to the "Puppet Agency" - a fleet of recon agents that can be deployed to any URL to extract information or perform actions.

System Capabilities & Tags:
1. <THINK>your reasoning here</THINK> : Use this to plan your next move.
2. <MEMORY_STORE key="unique_key">data to persist</MEMORY_STORE> : Store critical info that survives session handoffs.
3. <SESSION_ACTION>NEW_CHAT</SESSION_ACTION> : Trigger a session handoff to clear context bloat (MUST include <PROMPT>).
4. <SESSION_ACTION>CONTINUE</SESSION_ACTION> : Stay in the current session (MUST include <PROMPT>).
5. <PROMPT>your message here</PROMPT> : Provide the prompt for the next step.
6. <PUPPET_DEPLOY url="url"><PUPPET_COMMAND>CMD</PUPPET_COMMAND></PUPPET_DEPLOY> : Single command.
7. <PUPPET_CHAIN url="url"><CMD>CMD1</CMD><CMD>CMD2</CMD></PUPPET_CHAIN> : Sequence of commands.
8. <DONE>Final result</DONE> : When goal is achieved.

Available Puppet Commands:
EXTRACT_TEXT [selector], EXTRACT_HTML [selector], GET_LINKS, CLICK [selector], FILL [selector] [value], SELECT [selector] [value], HOVER [selector], DOUBLE_CLICK [selector], RIGHT_CLICK [selector], FOCUS [selector], BLUR [selector], CHECK [selector], UNCHECK [selector], SCROLL_WINDOW [x] [y], DRAG_AND_DROP [s] [t], PRESS [selector] [key], SMART_FILL_FORM [selector] [obj], ASSERT_STATE [selector] [cond] [val], ANALYZE_CONTEXT [selector], SMART_ADVANCE, SMART_LOGIN [u] [p], EXTRACT_SPATIAL, READ_ARTICLE, SCREENSHOT, WAIT [ms], SCROLL_BOTTOM, EVAL [js], GET_URL, GET_TITLE, GET_ATTRIBUTE [s] [a], CHECK_EXISTS [s], COUNT_ELEMENTS [s], SCROLL_TO [s], CLEAR_INPUT [s], SUBMIT_FORM [s], NAVIGATE [url], RELOAD, GO_BACK, GO_FORWARD, GET_LOCAL_STORAGE [k], SET_LOCAL_STORAGE [k] [v]

Begin your planning and output your first action.`;
  
  if (state.brainTabId) {
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: prompt });
  }
}

async function handleModelOutput(text) {
  if (state.status !== 'Running') return;

  // Parse DONE
  const doneMatch = text.match(/<DONE>([\s\S]*?)<\/DONE>/);
  if (doneMatch) {
    state.status = 'Completed';
    log(`Goal Achieved: ${doneMatch[1].substring(0, 50)}...`);
    saveState(true);
    return;
  }

  // Parse MEMORY_STORE
  const memoryRegex = /<MEMORY_STORE key="([^"]+)">([\s\S]*?)<\/MEMORY_STORE>/g;
  let match;
  while ((match = memoryRegex.exec(text)) !== null) {
    state.memory[match[1]] = match[2].trim();
    log(`Stored memory: ${match[1]}`);
  }
  saveState();

  // Parse PUPPET_DEPLOY
  const puppetDeployMatch = text.match(/<PUPPET_DEPLOY url="([^"]+)">\s*<PUPPET_COMMAND>([\s\S]*?)<\/PUPPET_COMMAND>\s*<\/PUPPET_DEPLOY>/);
  if (puppetDeployMatch) {
    const url = puppetDeployMatch[1];
    const command = puppetDeployMatch[2].trim();
    log(`Deploying puppet to ${url} with command: ${command}`);
    await deployPuppet(url, command);
    return;
  }

  // Parse PUPPET_CHAIN
  const puppetChainMatch = text.match(/<PUPPET_CHAIN url="([^"]+)">([\s\S]*?)<\/PUPPET_CHAIN>/);
  if (puppetChainMatch) {
    const url = puppetChainMatch[1];
    const commandsText = puppetChainMatch[2];
    const cmdRegex = /<CMD>([\s\S]*?)<\/CMD>/g;
    const commands = [];
    let cmdMatch;
    while ((cmdMatch = cmdRegex.exec(commandsText)) !== null) {
      commands.push(cmdMatch[1].trim());
    }
    log(`Deploying puppet chain to ${url} with ${commands.length} commands`);
    await deployPuppetChain(url, commands);
    return;
  }

  // Parse SESSION_ACTION
  const actionMatch = text.match(/<SESSION_ACTION>(NEW_CHAT|CONTINUE)<\/SESSION_ACTION>/);
  const promptMatch = text.match(/<PROMPT>([\s\S]*?)<\/PROMPT>/);

  if (!actionMatch || !promptMatch) {
    log('Missing tags. Asking model to correct.');
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System Error: Provide <SESSION_ACTION> and <PROMPT>, or <PUPPET_DEPLOY>/<PUPPET_CHAIN>.' });
    return;
  }

  const action = actionMatch[1];
  let nextPrompt = promptMatch[1].trim();

  if (action === 'NEW_CHAT') {
    log('Initiating Session Handoff (NEW_CHAT)...');
    const memoryContext = Object.keys(state.memory).length > 0
      ? `\n\n[SYSTEM INJECTED MEMORY]\n${JSON.stringify(state.memory, null, 2)}\n[/SYSTEM INJECTED MEMORY]`
      : '';
    
    state.pendingPrompt = `You are continuing a multi-session workflow.\n${memoryContext}\n\n[NEXT PROMPT]\n${nextPrompt}\n[/NEXT PROMPT]`;
    saveState(true);
    chrome.tabs.update(state.brainTabId, { url: 'https://aistudio.google.com/app/prompts/new_chat' });
  } else {
    log('Continuing in current session...');
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: nextPrompt });
  }
}

async function deployPuppet(url, command) {
  let tab;
  if (state.puppetTabId) {
    try {
      tab = await chrome.tabs.get(state.puppetTabId);
      if (tab.url !== url) tab = await chrome.tabs.update(state.puppetTabId, { url, active: false });
    } catch (e) {
      tab = await chrome.tabs.create({ url, active: false });
      state.puppetTabId = tab.id;
    }
  } else {
    tab = await chrome.tabs.create({ url, active: false });
    state.puppetTabId = tab.id;
  }
  saveState(true);

  const execute = () => {
    log('Puppet ready. Executing...');
    setTimeout(() => {
      chrome.tabs.sendMessage(state.puppetTabId, { action: 'PUPPET_EXECUTE', command }, (response) => {
        if (chrome.runtime.lastError) {
          reportPuppetResult(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        if (response && response.status === 'success') {
          reportPuppetResult(JSON.stringify(response.result));
        } else {
          reportPuppetResult(`Error: ${response ? response.error : 'Unknown error'}`);
        }
      });
    }, 2000);
  };

  if (tab.status === 'complete' && tab.url === url) execute();
  else {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === state.puppetTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        execute();
      }
    });
  }
}

async function deployPuppetChain(url, commands) {
  let tab;
  if (state.puppetTabId) {
    try {
      tab = await chrome.tabs.get(state.puppetTabId);
      if (tab.url !== url) tab = await chrome.tabs.update(state.puppetTabId, { url, active: false });
    } catch (e) {
      tab = await chrome.tabs.create({ url, active: false });
      state.puppetTabId = tab.id;
    }
  } else {
    tab = await chrome.tabs.create({ url, active: false });
    state.puppetTabId = tab.id;
  }
  saveState(true);

  const execute = () => {
    log('Puppet ready. Executing chain...');
    setTimeout(() => {
      chrome.tabs.sendMessage(state.puppetTabId, { action: 'PUPPET_EXECUTE_CHAIN', commands }, (response) => {
        if (chrome.runtime.lastError) {
          reportPuppetResult(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        if (response && response.status === 'success') {
          reportPuppetResult(JSON.stringify(response.result));
        } else {
          reportPuppetResult(`Error: ${response ? response.error : 'Unknown error'}`);
        }
      });
    }, 2000);
  };

  if (tab.status === 'complete' && tab.url === url) execute();
  else {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === state.puppetTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        execute();
      }
    });
  }
}

function reportPuppetResult(result) {
  const prompt = `[SYSTEM: PUPPET RECON REPORT]\n${result}\n[/SYSTEM: PUPPET RECON REPORT]\n\nAnalyze and determine next action.`;
  chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: prompt });
}
