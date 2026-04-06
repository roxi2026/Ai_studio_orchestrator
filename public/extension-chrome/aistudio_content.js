// aistudio_content.js - Injected ONLY into AI Studio (The "Brain")

function injectScript(file_path, node) {
  const th = document.getElementsByTagName(node)[0];
  const s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file_path);
  th.appendChild(s);
}

injectScript(chrome.runtime.getURL('inject.js'), 'body');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'SEND_PROMPT') {
    console.log('[CC Brain] Sending prompt to AI Studio...');
    const input = document.querySelector('textarea[aria-label="Type a message"]') || document.querySelector('textarea[placeholder*="Type"]');
    if (input) {
      input.value = msg.text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => {
        const btn = document.querySelector('button[aria-label="Run"]') || document.querySelector('button:has(svg)');
        if (btn) btn.click();
      }, 500);
    } else {
      console.error('[CC Brain] Could not find chat input field.');
    }
  }
});

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'ORCHESTRATOR_INJECT') return;
  
  const { type, payload } = event.data;

  // Intercept completion events from WebSocket, XHR, or Fetch
  if (type === 'WS_MESSAGE' || type === 'XHR_RESPONSE' || type === 'FETCH_RESPONSE') {
    if (payload.includes('"done": true')) {
      try {
        const data = JSON.parse(payload);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[CC Brain] Generation complete (${type}). Forwarding to background.`);
          chrome.runtime.sendMessage({ action: 'MODEL_OUTPUT_COMPLETE', text: text });
        }
      } catch(e) {
        // Ignore parse errors for incomplete chunks or non-JSON payloads
      }
    }
  }
});
