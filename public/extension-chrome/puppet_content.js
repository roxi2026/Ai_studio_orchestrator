// puppet_content.js - Puppet Recon "Free Agent"

// This script acts as the "free agent" deployed on target websites.
// It is procedurally scripted and directed by the Central Command (CC).

console.log("[Puppet Agent] Injected and awaiting orders from CC.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PUPPET_EXECUTE') {
    console.log("[Puppet Agent] Received execution orders:", message.command);
    
    executePuppetCommand(message.command)
      .then(result => {
        console.log("[Puppet Agent] Execution successful:", result);
        sendResponse({ status: 'success', result });
      })
      .catch(error => {
        console.error("[Puppet Agent] Execution failed:", error);
        sendResponse({ status: 'error', error: error.message || error.toString() });
      });
      
    return true; // Keep message channel open for async response
  }
});

async function executePuppetCommand(commandStr) {
  // Syntactic sugar for puppet commands
  // e.g., "EXTRACT_TEXT body", "CLICK #submit-btn", "GET_LINKS", "FILL #search query", "WAIT 2000"
  
  const parts = commandStr.trim().split(' ');
  const action = parts[0].toUpperCase();
  const target = parts.slice(1).join(' ');
  
  switch (action) {
    case 'EXTRACT_TEXT': {
      const el = target ? document.querySelector(target) : document.body;
      if (!el) throw new Error(`Element not found: ${target}`);
      return { type: 'text', content: el.innerText.substring(0, 10000) }; // Cap length to avoid token limits
    }
      
    case 'EXTRACT_HTML': {
      const htmlEl = target ? document.querySelector(target) : document.body;
      if (!htmlEl) throw new Error(`Element not found: ${target}`);
      return { type: 'html', content: htmlEl.innerHTML.substring(0, 10000) };
    }
      
    case 'GET_LINKS': {
      const links = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.startsWith('http'))
        .map(a => ({ text: a.innerText.trim(), href: a.href }))
        .filter(link => link.text.length > 0);
      return { type: 'links', count: links.length, content: links.slice(0, 50) }; // Max 50 links
    }
      
    case 'CLICK': {
      const clickEl = document.querySelector(target);
      if (!clickEl) throw new Error(`Element not found: ${target}`);
      clickEl.click();
      return { type: 'action', content: `Clicked ${target}` };
    }

    case 'FILL': {
      // Format: FILL #selector value
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid FILL format. Use: FILL #selector value`);
      const selector = target.substring(0, firstSpace);
      const value = target.substring(firstSpace + 1);
      
      const inputEl = document.querySelector(selector);
      if (!inputEl) throw new Error(`Element not found: ${selector}`);
      
      inputEl.value = value;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      return { type: 'action', content: `Filled ${selector} with "${value}"` };
    }

    case 'WAIT': {
      const ms = parseInt(target, 10);
      if (isNaN(ms)) throw new Error(`Invalid wait time: ${target}`);
      await new Promise(resolve => setTimeout(resolve, ms));
      return { type: 'action', content: `Waited ${ms}ms` };
    }

    case 'SCROLL_BOTTOM': {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for lazy load
      return { type: 'action', content: `Scrolled to bottom` };
    }
      
    case 'EVAL': {
      // Dangerous but powerful for a true puppet agent
      // CC should ensure safety
      try {
        const evalResult = await Promise.resolve(eval(target));
        return { type: 'eval', content: evalResult ? evalResult.toString() : 'Success (no return value)' };
      } catch (e) {
        throw new Error(`Eval failed: ${e.message}`);
      }
    }
      
    default:
      throw new Error(`Unknown puppet command: ${action}`);
  }
}
