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
  brainTabId: null,
  puppetTabId: null,
  pendingPrompt: null
};

let saveTimeout = null;
const MAX_SAVE_DELAY = 15000;
let lastSaveTime = 0;

function log(text) {
  console.log(`[CC] ${text}`);
  const logEntry = { text, timestamp: Date.now() };
  state.logs.push(logEntry);
  if (state.logs.length > 50) state.logs.shift();

  // Real-time broadcast for UI immediate update (bypasses storage delay)
  broadcastToAIStudio({ action: 'LOG_EVENT', log: logEntry });
  saveState();
}

function saveState() {
  if (saveTimeout) clearTimeout(saveTimeout);

  const now = Date.now();
  const timeSinceLastSave = now - lastSaveTime;

  if (timeSinceLastSave > MAX_SAVE_DELAY) {
    commitState();
  } else {
    saveTimeout = setTimeout(commitState, 5000);
  }
}

function commitState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  lastSaveTime = Date.now();
  chrome.storage.local.set({ orchestratorState: state });
}

function broadcastToAIStudio(message) {
  chrome.tabs.query({ url: '*://aistudio.google.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors for tabs that are closed or not ready
      });
    });
  });
}

chrome.storage.local.get(['orchestratorState'], (result) => {
  if (result.orchestratorState) state = result.orchestratorState;
});

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

// --- Central Command (CC) Engine ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KEEPALIVE') return;
  if (message.action === 'START_ORCHESTRATION') startOrchestration(message.goal);
  if (message.action === 'STOP_ORCHESTRATION') {
    state.status = 'Idle';
    state.pendingPrompt = null;
    log('Orchestration stopped by user.');
    saveState();
  }
  if (message.action === 'CLEAR_MEMORY') {
    state.memory = {};
    log('Memory cleared by user.');
    saveState();
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
  broadcastToAIStudio({ action: 'CLEAR_LOGS' }); // Ensure UI is reset
  log('Initializing Central Command (CC)...');
  
  const tabs = await chrome.tabs.query({ url: 'https://aistudio.google.com/*' });
  if (tabs.length === 0) {
    log('Error: AI Studio tab not found.');
    state.status = 'Error';
    saveState();
    return;
  }
  
  state.brainTabId = tabs[0].id;
  
  const prompt = `You are the Central Command (CC) of a cutting-edge browser agency. Your goal is: ${goal}.
You oversee the deployment and communications between chunked sequences established by the puppet-side of the extension.

RULES & SYNTACTIC SUGAR:
1. <MEMORY_STORE key="name">data</MEMORY_STORE> : Store context for the future.
2. <SESSION_ACTION>CONTINUE</SESSION_ACTION> : Execute the next step in the CURRENT session.
3. <SESSION_ACTION>NEW_CHAT</SESSION_ACTION> : Start a FRESH session (to clear context window).
4. <PROMPT>your prompt here</PROMPT> : Provide the prompt for the next step (or new session).
5. <PUPPET_DEPLOY url="https://example.com"><PUPPET_COMMAND>EXTRACT_TEXT body</PUPPET_COMMAND></PUPPET_DEPLOY> : Deploy the puppet recon "free agent" to a URL and execute a command.
   Available commands:
   - EXTRACT_TEXT [selector]
   - EXTRACT_HTML [selector]
   - GET_LINKS
   - CLICK [selector]
   - FILL [selector] [value]
   - SELECT [selector] [value]
   - HOVER [selector]
   - DOUBLE_CLICK [selector]
   - RIGHT_CLICK [selector]
   - FOCUS [selector]
   - BLUR [selector]
   - CHECK [selector]
   - UNCHECK [selector]
   - SCROLL_WINDOW [x] [y]
   - DRAG_AND_DROP [source_selector] [target_selector]
   - PRESS [selector] [key]
   - SMART_FILL_FORM [form_selector] [objective_json]
   - ASSERT_STATE [selector] [condition] [expectedValue]
   - ANALYZE_CONTEXT [selector]
   - SMART_ADVANCE
   - SMART_LOGIN [username] [password]
   - EXTRACT_SPATIAL
   - READ_ARTICLE [optional JSON config: {"metadataSelectors": {"key": "selector"}, "excludeSelectors": [".ad"]}]
   - SCREENSHOT
   - WAIT [ms]
   - SCROLL_BOTTOM
   - EVAL [js code]
   - GET_URL
   - GET_TITLE
   - GET_ATTRIBUTE [selector] [attrName]
   - CHECK_EXISTS [selector]
   - COUNT_ELEMENTS [selector]
   - SCROLL_TO [selector]
   - CLEAR_INPUT [selector]
   - SUBMIT_FORM [selector]
   - NAVIGATE [url]
   - RELOAD
   - GO_BACK
   - GO_FORWARD
   - GET_LOCAL_STORAGE [key]
   - SET_LOCAL_STORAGE [key] [value]
6. <PUPPET_CHAIN url="https://example.com">
     <CMD>CLICK #btn</CMD>
     <CMD>WAIT 1000</CMD>
     <CMD>EXTRACT_TEXT body</CMD>
   </PUPPET_CHAIN> : Deploy the puppet to execute a sequence of commands without waiting for round-trips.
7. <THINK>your reasoning here</THINK> : Use this to plan your next move before outputting actions.
8. <DONE>Final result</DONE> : When the entire goal is complete.

Begin your planning and output your first action.`;
  
  chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: prompt });
}

async function handleModelOutput(text) {
  if (state.status !== 'Running') return;

  // Parse DONE
  const doneMatch = text.match(/<DONE>([\s\S]*?)<\/DONE>/);
  if (doneMatch) {
    state.status = 'Completed';
    log(`Goal Achieved: ${doneMatch[1].substring(0, 50)}...`);
    saveState();
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
    return; // Wait for puppet to respond
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
    return; // Wait for puppet to respond
  }

  // Parse SESSION_ACTION
  const actionMatch = text.match(/<SESSION_ACTION>(NEW_CHAT|CONTINUE)<\/SESSION_ACTION>/);
  const promptMatch = text.match(/<PROMPT>([\s\S]*?)<\/PROMPT>/);

  if (!actionMatch || !promptMatch) {
    log('Missing SESSION_ACTION or PROMPT tags. Asking model to correct.');
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: 'System Error: Please provide both <SESSION_ACTION> and <PROMPT> tags, or a <PUPPET_DEPLOY> or <PUPPET_CHAIN> tag.' });
    return;
  }

  const action = actionMatch[1];
  let nextPrompt = promptMatch[1].trim();

  if (action === 'NEW_CHAT') {
    log('Initiating Session Handoff (NEW_CHAT)...');
    // Inject memory into the new prompt
    const memoryContext = Object.keys(state.memory).length > 0
      ? `\n\n[SYSTEM INJECTED MEMORY FROM PREVIOUS SESSIONS]\n${JSON.stringify(state.memory, null, 2)}\n[/SYSTEM INJECTED MEMORY]`
      : '';
    
    state.pendingPrompt = `You are continuing a multi-session workflow. Here is the context and your next prompt:\n${memoryContext}\n\n[NEXT PROMPT]\n${nextPrompt}\n[/NEXT PROMPT]\n\nRemember to use <MEMORY_STORE>, <SESSION_ACTION>, <PROMPT>, <PUPPET_DEPLOY>, and <PUPPET_CHAIN> tags to continue orchestrating.`;
    saveState();
    
    // Trigger session handoff
    chrome.tabs.update(state.brainTabId, { url: 'https://aistudio.google.com/app/prompts/new_chat' });
  } else {
    log('Continuing in current session...');
    chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: nextPrompt });
  }
}

async function deployPuppet(url, command) {
  let tab;
  // Create or update puppet tab
  if (state.puppetTabId) {
    try {
      tab = await chrome.tabs.get(state.puppetTabId);
      if (tab.url !== url) {
        tab = await chrome.tabs.update(state.puppetTabId, { url, active: false });
      }
    } catch (e) {
      tab = await chrome.tabs.create({ url, active: false });
      state.puppetTabId = tab.id;
    }
  } else {
    tab = await chrome.tabs.create({ url, active: false });
    state.puppetTabId = tab.id;
  }
  
  saveState();

  const execute = () => {
    log('Puppet tab ready. Executing command...');
    setTimeout(() => {
      let responded = false;
      
      // Timeout mechanism
      const timeoutId = setTimeout(() => {
        if (!responded) {
          responded = true;
          log(`Puppet execution timed out after 15s.`);
          reportPuppetResult(`Error: Execution timed out.`);
        }
      }, 15000);

      chrome.tabs.sendMessage(state.puppetTabId, { action: 'PUPPET_EXECUTE', command }, (response) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          log(`Puppet execution error: ${chrome.runtime.lastError.message}`);
          reportPuppetResult(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response && response.status === 'success') {
          log('Puppet execution successful.');
          reportPuppetResult(JSON.stringify(response.result));
        } else {
          log(`Puppet execution failed: ${response ? response.error : 'Unknown error'}`);
          reportPuppetResult(`Error: ${response ? response.error : 'Unknown error'}`);
        }
      });
    }, 2000); // Give scripts a moment to initialize
  };

  if (tab.status === 'complete' && tab.url === url) {
    execute();
  } else {
    // Wait for tab to finish loading
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
  // Create or update puppet tab
  if (state.puppetTabId) {
    try {
      tab = await chrome.tabs.get(state.puppetTabId);
      if (tab.url !== url) {
        tab = await chrome.tabs.update(state.puppetTabId, { url, active: false });
      }
    } catch (e) {
      tab = await chrome.tabs.create({ url, active: false });
      state.puppetTabId = tab.id;
    }
  } else {
    tab = await chrome.tabs.create({ url, active: false });
    state.puppetTabId = tab.id;
  }
  
  saveState();

  const execute = () => {
    log('Puppet tab ready. Executing chain...');
    setTimeout(() => {
      let responded = false;
      
      // Timeout mechanism - give more time for chains (e.g., 30s)
      const timeoutId = setTimeout(() => {
        if (!responded) {
          responded = true;
          log(`Puppet chain execution timed out after 30s.`);
          reportPuppetResult(`Error: Chain execution timed out.`);
        }
      }, 30000);

      chrome.tabs.sendMessage(state.puppetTabId, { action: 'PUPPET_EXECUTE_CHAIN', commands }, (response) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          log(`Puppet chain execution error: ${chrome.runtime.lastError.message}`);
          reportPuppetResult(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response && response.status === 'success') {
          log('Puppet chain execution successful.');
          reportPuppetResult(JSON.stringify(response.result));
        } else {
          log(`Puppet chain execution failed: ${response ? response.error : 'Unknown error'}`);
          reportPuppetResult(`Error: ${response ? response.error : 'Unknown error'}`);
        }
      });
    }, 2000); // Give scripts a moment to initialize
  };

  if (tab.status === 'complete' && tab.url === url) {
    execute();
  } else {
    // Wait for tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === state.puppetTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        execute();
      }
    });
  }
}

function reportPuppetResult(result) {
  const prompt = `[SYSTEM: PUPPET RECON REPORT]\n${result}\n[/SYSTEM: PUPPET RECON REPORT]\n\nAnalyze the report and determine the next action using <SESSION_ACTION> and <PROMPT>, or another <PUPPET_DEPLOY> or <PUPPET_CHAIN>.`;
  chrome.tabs.sendMessage(state.brainTabId, { action: 'SEND_PROMPT', text: prompt });
}
