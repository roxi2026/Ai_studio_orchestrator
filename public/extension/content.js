// content.js - Injected into ALL URLs (The "Hands" and "Eyes")

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'EXECUTE_DOM') {
    console.log(`[Orchestrator Agent] Executing DOM Action: ${msg.cmd.type}`);
    handleDomAction(msg.cmd)
      .then(res => sendResponse({ result: res }))
      .catch(e => sendResponse({ result: 'Error: ' + e.message }));
    return true; // Indicates async response
  }
});

function highlightElement(el) {
  if (!el || !el.style) return;
  const oldOutline = el.style.outline;
  const oldTransition = el.style.transition;
  const oldBoxShadow = el.style.boxShadow;
  
  el.style.transition = 'all 0.3s ease-in-out';
  el.style.outline = '3px solid #10b981';
  el.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.8)';
  
  setTimeout(() => {
    el.style.outline = oldOutline;
    el.style.boxShadow = oldBoxShadow;
    el.style.transition = oldTransition;
  }, 1500);
}

async function handleDomAction(cmd) {
  if (cmd.type === 'EVALUATE') {
    // Unsafe but powerful for an autonomous agent
    return String(eval(cmd.script));
  }
  
  const el = findElement(cmd.selector);
  if (!el && cmd.type !== 'EVALUATE') {
    throw new Error(`Element not found: ${cmd.selector}`);
  }
  
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightElement(el);
  }
  
  if (cmd.type === 'CLICK') {
    el.click();
    return 'Clicked successfully.';
  } else if (cmd.type === 'TYPE') {
    el.focus();
    el.value = cmd.text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return 'Typed successfully.';
  } else if (cmd.type === 'READ') {
    return el.innerText || el.value || 'Element is empty.';
  }
  
  throw new Error(`Unknown action type: ${cmd.type}`);
}

function findElement(selector) {
  if (!selector) return null;
  if (selector.startsWith('//')) {
    return document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }
  return document.querySelector(selector);
}
