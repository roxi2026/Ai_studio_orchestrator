// puppet_content.js - Puppet Recon "Free Agent"

// This script acts as the "free agent" deployed on target websites.
// It is procedurally scripted and directed by the Central Command (CC).

console.log("[Puppet Agent] Injected and awaiting orders from CC.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PUPPET_EXECUTE') {
    console.log("[Puppet Agent] Received execution orders:", message.command);
    
    try {
      const result = executePuppetCommand(message.command);
      sendResponse({ status: 'success', result });
    } catch (error) {
      console.error("[Puppet Agent] Execution failed:", error);
      sendResponse({ status: 'error', error: error.toString() });
    }
    return true; // Keep message channel open for async response
  }
});

function executePuppetCommand(command) {
  // Syntactic sugar for puppet commands
  // e.g., "EXTRACT_TEXT body", "CLICK #submit-btn", "GET_LINKS"
  
  const parts = command.trim().split(' ');
  const action = parts[0];
  const target = parts.slice(1).join(' ');
  
  switch (action) {
    case 'EXTRACT_TEXT':
      const el = target ? document.querySelector(target) : document.body;
      return el ? el.innerText : 'Element not found';
      
    case 'EXTRACT_HTML':
      const htmlEl = target ? document.querySelector(target) : document.body;
      return htmlEl ? htmlEl.innerHTML : 'Element not found';
      
    case 'GET_LINKS':
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText,
        href: a.href
      }));
      return JSON.stringify(links);
      
    case 'CLICK':
      const clickEl = document.querySelector(target);
      if (clickEl) {
        clickEl.click();
        return `Clicked ${target}`;
      }
      return `Element ${target} not found`;
      
    case 'EVAL':
      // Dangerous but powerful for a true puppet agent
      // CC should ensure safety
      return eval(target);
      
    default:
      throw new Error(`Unknown puppet command: ${action}`);
  }
}
