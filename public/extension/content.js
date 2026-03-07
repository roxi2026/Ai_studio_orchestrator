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

async function handleDomAction(cmd) {
  if (cmd.type === 'EVALUATE') {
    // Unsafe but powerful for an autonomous agent
    return String(eval(cmd.script));
  }
  
  const el = findElement(cmd.selector);
  if (!el && cmd.type !== 'EVALUATE') {
    throw new Error(`Element not found: ${cmd.selector}`);
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
