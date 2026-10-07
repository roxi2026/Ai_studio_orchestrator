// puppet_content.js - Puppet Recon "Free Agent"

// --- Local SLM / Heuristics Engine ---
// This acts as the "imported small language model understandings" for local reasoning,
// persona crafting, and dynamic form handling to reduce LLM API calls.
class LocalSLMEngine {
  static async generatePersona(objective) {
    // In a full implementation, this would call a local WebLLM or Transformers.js model.
    // Here we use advanced heuristics to craft a persona based on the objective.
    console.log("[SLM Engine] Crafting persona for objective:", objective);
    const basePersona = {
      firstName: "Alex",
      lastName: "Smith",
      email: "alex.smith.test" + Math.floor(Math.random() * 10000) + "@example.com",
      phone: "555-019-8372",
      company: "Acme Corp",
      address: "123 Innovation Drive",
      city: "Techville",
      state: "CA",
      zip: "90210",
      country: "US",
      password: "SecurePass123!@",
      username: "alex_smith_" + Math.floor(Math.random() * 1000)
    };

    if (objective.toLowerCase().includes("business") || objective.toLowerCase().includes("b2b")) {
      basePersona.jobTitle = "Director of Operations";
      basePersona.industry = "Technology";
    }
    return basePersona;
  }

  static inferFieldType(el, contextText) {
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const placeholder = (el.placeholder || '').toLowerCase();
    const type = (el.type || '').toLowerCase();
    const combined = `${name} ${id} ${placeholder} ${contextText.toLowerCase()}`;

    if (combined.includes('email')) return 'email';
    if (combined.includes('first') && combined.includes('name')) return 'firstName';
    if (combined.includes('last') && combined.includes('name')) return 'lastName';
    if (combined.includes('name') || combined.includes('full name')) return 'fullName';
    if (combined.includes('phone') || combined.includes('tel')) return 'phone';
    if (combined.includes('company') || combined.includes('organization')) return 'company';
    if (combined.includes('address') || combined.includes('street')) return 'address';
    if (combined.includes('city')) return 'city';
    if (combined.includes('state') || combined.includes('province')) return 'state';
    if (combined.includes('zip') || combined.includes('postal')) return 'zip';
    if (combined.includes('country')) return 'country';
    if (combined.includes('password')) return 'password';
    if (combined.includes('user') && combined.includes('name')) return 'username';
    if (type === 'password') return 'password';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    
    return 'unknown';
  }
}

// --- Smart Agent for Dynamic Interactions ---
class SmartAgent {
  static async getContext(el) {
    // Extract surrounding context (labels, preceding text)
    let context = '';
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) context += label.innerText + ' ';
    }
    const parent = el.parentElement;
    if (parent) {
      context += parent.innerText.substring(0, 100);
    }
    return context.trim();
  }

  static async smartFillForm(formSelector, objectiveJson) {
    const form = document.querySelector(formSelector);
    if (!form) throw new Error(`Form not found: ${formSelector}`);

    let objective = {};
    try {
      objective = JSON.parse(objectiveJson);
    } catch (e) {
      objective = { description: objectiveJson };
    }

    const persona = await LocalSLMEngine.generatePersona(objective.description || 'general registration');
    const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea'));
    
    const results = [];
    
    for (const input of inputs) {
      // 1. Contextual Awareness
      const context = await this.getContext(input);
      
      // 2. SLM Inference
      const fieldType = LocalSLMEngine.inferFieldType(input, context);
      
      // 3. Dynamic Value Generation
      let valueToFill = null;
      if (persona[fieldType]) {
        valueToFill = persona[fieldType];
      } else if (fieldType === 'fullName') {
        valueToFill = `${persona.firstName} ${persona.lastName}`;
      } else if (input.tagName.toLowerCase() === 'select') {
        // Handle dropdowns dynamically
        const options = Array.from(input.options);
        if (options.length > 1) {
          // Try to find a matching option, else pick the second one (usually first valid)
          const match = options.find(o => o.text.toLowerCase().includes(persona.state?.toLowerCase() || ''));
          valueToFill = match ? match.value : options[1].value;
        }
      } else if (input.type === 'checkbox' || input.type === 'radio') {
        // Predict if it should be checked (e.g., terms of service)
        if (context.toLowerCase().includes('agree') || context.toLowerCase().includes('terms')) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          results.push({ field: input.name || input.id, action: 'checked', context });
          continue;
        }
      }

      // 4. Execution & Failsafes
      if (valueToFill !== null) {
        input.value = valueToFill;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Self-check: Did the value stick?
        if (input.value !== valueToFill && input.tagName.toLowerCase() !== 'select') {
           console.warn(`[SmartAgent] Failsafe triggered: Value for ${input.name || input.id} did not persist. Retrying via keypress simulation.`);
           input.value = '';
           for (let char of valueToFill) {
             input.value += char;
             input.dispatchEvent(new Event('input', { bubbles: true }));
           }
        }
        
        results.push({ field: input.name || input.id, inferredType: fieldType, filledValue: valueToFill });
      }
    }

    return { type: 'smart_form_fill', personaUsed: persona, fieldsProcessed: results };
  }

  static async assertState(selector, condition, expectedValue) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Assertion failed: Element ${selector} not found.`);
    
    let actualValue;
    switch (condition.toLowerCase()) {
      case 'visible':
        actualValue = el.offsetWidth > 0 && el.offsetHeight > 0;
        if (String(actualValue) !== String(expectedValue)) throw new Error(`Assertion failed: ${selector} visibility is ${actualValue}, expected ${expectedValue}`);
        break;
      case 'value':
        actualValue = el.value;
        if (actualValue !== expectedValue) throw new Error(`Assertion failed: ${selector} value is "${actualValue}", expected "${expectedValue}"`);
        break;
      case 'text':
        actualValue = el.innerText.trim();
        if (!actualValue.includes(expectedValue)) throw new Error(`Assertion failed: ${selector} text "${actualValue}" does not contain "${expectedValue}"`);
        break;
      case 'checked':
        actualValue = el.checked;
        if (String(actualValue) !== String(expectedValue)) throw new Error(`Assertion failed: ${selector} checked is ${actualValue}, expected ${expectedValue}`);
        break;
      default:
        throw new Error(`Unknown assertion condition: ${condition}`);
    }
    return { type: 'assertion', status: 'passed', selector, condition, expectedValue };
  }
  static async smartAdvance() {
    // Look for buttons that typically advance a form or process
    const advanceKeywords = ['next', 'continue', 'submit', 'save', 'proceed', 'checkout', 'confirm'];
    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button, [role="button"]'));
    
    let bestButton = null;
    let maxScore = -1;

    for (const btn of buttons) {
      // Use textContent instead of innerText to avoid forcing layout reflows during scoring loop
      const text = (btn.textContent || btn.value || '').toLowerCase().trim();
      if (!text) continue;
      
      // Is it visible?
      if (btn.offsetWidth === 0 || btn.offsetHeight === 0) continue;

      let score = 0;
      for (const keyword of advanceKeywords) {
        if (text === keyword) score += 10;
        else if (text.includes(keyword)) score += 5;
      }

      // Prefer buttons at the bottom of the form/page
      const rect = btn.getBoundingClientRect();
      score += (rect.y / window.innerHeight); 

      if (score > maxScore) {
        maxScore = score;
        bestButton = btn;
      }
    }

    if (bestButton) {
      const btnText = (bestButton.textContent || bestButton.value || '').trim();
      bestButton.click();
      
      // Wait for potential animations or DOM updates
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if new inputs appeared (occluded steps)
      const newInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea').length;
      
      return { 
        type: 'smart_advance', 
        action: `Clicked "${btnText}"`, 
        newInputsDetected: newInputs > 0 
      };
    }

    throw new Error("Could not find a suitable button to advance the form.");
  }
  static async smartLogin(username, password) {
    // 1. Find the password field (the most reliable indicator of a login form)
    const passField = document.querySelector('input[type="password"]');
    if (!passField) throw new Error("Could not find a password field on this page.");
    
    // 2. Find the associated username/email field
    const form = passField.closest('form') || document.body;
    const userField = form.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
    
    if (!userField) throw new Error("Could not find a username/email field.");

    // 3. Fill the fields
    userField.value = username;
    userField.dispatchEvent(new Event('input', { bubbles: true }));
    userField.dispatchEvent(new Event('change', { bubbles: true }));
    
    passField.value = password;
    passField.dispatchEvent(new Event('input', { bubbles: true }));
    passField.dispatchEvent(new Event('change', { bubbles: true }));

    // 4. Advance (Submit)
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button');
    if (submitBtn) {
      submitBtn.click();
    } else if (form.tagName.toLowerCase() === 'form') {
      form.submit();
    } else {
      // Fallback: press Enter on password field
      passField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }

    // 5. Wait and Verify
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we are still on the login page (password field still exists and is visible)
    const passFieldAfter = document.querySelector('input[type="password"]');
    const isStillVisible = passFieldAfter && passFieldAfter.offsetWidth > 0;
    
    // Check for common error messages
    const errorText = Array.from(document.querySelectorAll('.error, .alert, .message, [role="alert"]'))
      .map(el => el.innerText.toLowerCase())
      .find(t => t.includes('incorrect') || t.includes('invalid') || t.includes('wrong') || t.includes('fail'));

    if (isStillVisible && errorText) {
      throw new Error(`Login failed. Detected error: ${errorText}`);
    } else if (isStillVisible) {
      return { type: 'smart_login', status: 'warning', message: 'Login submitted, but password field is still visible. May require captcha or 2FA.' };
    }

    return { type: 'smart_login', status: 'success', message: 'Login submitted and appears successful.' };
  }
}

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

  if (message.action === 'PUPPET_EXECUTE_CHAIN') {
    console.log("[Puppet Agent] Received execution chain:", message.commands);
    
    executePuppetChain(message.commands)
      .then(results => {
        console.log("[Puppet Agent] Chain execution successful:", results);
        sendResponse({ status: 'success', result: results });
      })
      .catch(error => {
        console.error("[Puppet Agent] Chain execution failed:", error);
        sendResponse({ status: 'error', error: error.message || error.toString() });
      });
      
    return true;
  }
});

async function executePuppetChain(commands) {
  const results = [];
  for (const cmd of commands) {
    try {
      const res = await executePuppetCommand(cmd);
      results.push({ command: cmd, status: 'success', result: res });
    } catch (e) {
      results.push({ command: cmd, status: 'error', error: e.message });
      break; // Stop chain on error
    }
  }
  return results;
}

async function executePuppetCommand(commandStr) {
  // Syntactic sugar for puppet commands
  // e.g., "EXTRACT_TEXT body", "CLICK #submit-btn", "GET_LINKS", "FILL #search query", "WAIT 2000"
  
  const parts = commandStr.trim().split(' ');
  const action = parts[0].toUpperCase();
  const target = parts.slice(1).join(' ');
  
  switch (action) {
    case 'SMART_FILL_FORM': {
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid SMART_FILL_FORM format. Use: SMART_FILL_FORM #selector objective_json`);
      const selector = target.substring(0, firstSpace);
      const objectiveJson = target.substring(firstSpace + 1);
      return await SmartAgent.smartFillForm(selector, objectiveJson);
    }

    case 'ASSERT_STATE': {
      const parts = target.split(' ');
      if (parts.length < 3) throw new Error(`Invalid ASSERT_STATE format. Use: ASSERT_STATE #selector condition expectedValue`);
      const selector = parts[0];
      const condition = parts[1];
      const expectedValue = parts.slice(2).join(' ');
      return await SmartAgent.assertState(selector, condition, expectedValue);
    }

    case 'ANALYZE_CONTEXT': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      const context = await SmartAgent.getContext(el);
      return { type: 'context_analysis', selector: target, context: context };
    }

    case 'SMART_ADVANCE': {
      return await SmartAgent.smartAdvance();
    }

    case 'SMART_LOGIN': {
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid SMART_LOGIN format. Use: SMART_LOGIN username password`);
      const username = target.substring(0, firstSpace);
      const password = target.substring(firstSpace + 1);
      return await SmartAgent.smartLogin(username, password);
    }

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
      // Query a[href] directly and use textContent to prevent forced layout reflows on all link elements
      const links = Array.from(document.querySelectorAll('a[href]'))
        .filter(a => a.href && a.href.startsWith('http'))
        .map(a => ({ text: a.textContent.trim(), href: a.href }))
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

    case 'SELECT': {
      // Format: SELECT #selector value
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid SELECT format. Use: SELECT #selector value`);
      const selector = target.substring(0, firstSpace);
      const value = target.substring(firstSpace + 1);
      
      const selectEl = document.querySelector(selector);
      if (!selectEl) throw new Error(`Element not found: ${selector}`);
      
      selectEl.value = value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      return { type: 'action', content: `Selected "${value}" in ${selector}` };
    }

    case 'HOVER': {
      const hoverEl = document.querySelector(target);
      if (!hoverEl) throw new Error(`Element not found: ${target}`);
      hoverEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      hoverEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      return { type: 'action', content: `Hovered over ${target}` };
    }

    case 'DOUBLE_CLICK': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      return { type: 'action', content: `Double clicked ${target}` };
    }

    case 'RIGHT_CLICK': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
      return { type: 'action', content: `Right clicked ${target}` };
    }

    case 'FOCUS': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.focus();
      return { type: 'action', content: `Focused ${target}` };
    }

    case 'BLUR': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.blur();
      return { type: 'action', content: `Blurred ${target}` };
    }

    case 'CHECK': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { type: 'action', content: `Checked ${target}` };
      }
      throw new Error(`Element is not a checkbox or radio: ${target}`);
    }

    case 'UNCHECK': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { type: 'action', content: `Unchecked ${target}` };
      }
      throw new Error(`Element is not a checkbox or radio: ${target}`);
    }

    case 'SCROLL_WINDOW': {
      const parts = target.split(' ');
      const x = parseInt(parts[0], 10) || 0;
      const y = parseInt(parts[1], 10) || 0;
      window.scrollTo(x, y);
      return { type: 'action', content: `Scrolled window to ${x}, ${y}` };
    }

    case 'DRAG_AND_DROP': {
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid DRAG_AND_DROP format. Use: DRAG_AND_DROP #source #target`);
      const sourceSel = target.substring(0, firstSpace);
      const targetSel = target.substring(firstSpace + 1);
      
      const sourceEl = document.querySelector(sourceSel);
      const targetEl = document.querySelector(targetSel);
      
      if (!sourceEl) throw new Error(`Source element not found: ${sourceSel}`);
      if (!targetEl) throw new Error(`Target element not found: ${targetSel}`);
      
      const dataTransfer = new DataTransfer();
      sourceEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      targetEl.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }));
      targetEl.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
      targetEl.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
      sourceEl.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }));
      
      return { type: 'action', content: `Dragged ${sourceSel} to ${targetSel}` };
    }

    case 'PRESS': {
      // Format: PRESS #selector key
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid PRESS format. Use: PRESS #selector key`);
      const selector = target.substring(0, firstSpace);
      const key = target.substring(firstSpace + 1);
      
      const pressEl = document.querySelector(selector);
      if (!pressEl) throw new Error(`Element not found: ${selector}`);
      
      pressEl.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
      pressEl.dispatchEvent(new KeyboardEvent('keypress', { key: key, bubbles: true }));
      pressEl.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true }));
      return { type: 'action', content: `Pressed ${key} on ${selector}` };
    }

    case 'EXTRACT_SPATIAL': {
      // Get interactive elements with their bounding boxes
      const interactives = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'));
      // Use textContent instead of innerText to prevent layout reflows during batch element processing
      const spatialData = interactives.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.value || el.placeholder || el.title || '').trim().substring(0, 50),
          id: el.id,
          className: el.className,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        };
      }).filter(d => d.w > 0 && d.h > 0); // Only visible elements
      
      return { type: 'spatial', count: spatialData.length, content: JSON.stringify(spatialData.slice(0, 100)) }; // Limit to 100
    }

    case 'GET_URL': {
      return { type: 'url', content: window.location.href };
    }

    case 'GET_TITLE': {
      return { type: 'title', content: document.title };
    }

    case 'GET_ATTRIBUTE': {
      // Format: GET_ATTRIBUTE #selector attrName
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid GET_ATTRIBUTE format. Use: GET_ATTRIBUTE #selector attrName`);
      const selector = target.substring(0, firstSpace);
      const attrName = target.substring(firstSpace + 1);
      
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Element not found: ${selector}`);
      
      return { type: 'attribute', content: el.getAttribute(attrName) };
    }

    case 'CHECK_EXISTS': {
      const el = document.querySelector(target);
      return { type: 'exists', content: !!el };
    }

    case 'COUNT_ELEMENTS': {
      const els = document.querySelectorAll(target);
      return { type: 'count', content: els.length };
    }

    case 'SCROLL_TO': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for scroll
      return { type: 'action', content: `Scrolled to ${target}` };
    }

    case 'CLEAR_INPUT': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { type: 'action', content: `Cleared input ${target}` };
    }

    case 'SUBMIT_FORM': {
      const el = document.querySelector(target);
      if (!el) throw new Error(`Element not found: ${target}`);
      if (el.tagName.toLowerCase() !== 'form') throw new Error(`Element is not a form: ${target}`);
      el.submit();
      return { type: 'action', content: `Submitted form ${target}` };
    }

    case 'NAVIGATE': {
      window.location.href = target;
      return { type: 'action', content: `Navigating to ${target}` };
    }

    case 'RELOAD': {
      window.location.reload();
      return { type: 'action', content: `Reloading page` };
    }

    case 'GO_BACK': {
      window.history.back();
      return { type: 'action', content: `Going back` };
    }

    case 'GO_FORWARD': {
      window.history.forward();
      return { type: 'action', content: `Going forward` };
    }

    case 'GET_LOCAL_STORAGE': {
      return { type: 'local_storage', content: localStorage.getItem(target) };
    }

    case 'SET_LOCAL_STORAGE': {
      const firstSpace = target.indexOf(' ');
      if (firstSpace === -1) throw new Error(`Invalid SET_LOCAL_STORAGE format. Use: SET_LOCAL_STORAGE key value`);
      const key = target.substring(0, firstSpace);
      const value = target.substring(firstSpace + 1);
      localStorage.setItem(key, value);
      return { type: 'action', content: `Set local storage ${key}=${value}` };
    }

    case 'READ_ARTICLE': {
      let config = {
        metadataSelectors: {},
        excludeSelectors: []
      };
      
      if (target) {
        try {
          config = JSON.parse(target);
        } catch (e) {
          console.warn("[Puppet Agent] Invalid JSON config for READ_ARTICLE, using defaults.");
        }
      }

      // 1. Extract Metadata (from original document to ensure meta tags are caught)
      const metadata = {};
      
      const getMetaContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? (el.content || el.innerText || el.textContent).trim() : null;
      };

      metadata.title = getMetaContent('meta[property="og:title"]') || getMetaContent('title') || getMetaContent('h1');
      metadata.author = getMetaContent('meta[name="author"]') || getMetaContent('meta[property="article:author"]') || getMetaContent('[rel="author"]') || getMetaContent('.author, .byline');
      metadata.date = getMetaContent('meta[property="article:published_time"]') || getMetaContent('meta[name="date"]') || getMetaContent('time[datetime]');
      metadata.description = getMetaContent('meta[property="og:description"]') || getMetaContent('meta[name="description"]');

      // Custom Metadata from Agency Config
      if (config.metadataSelectors) {
        for (const [key, selector] of Object.entries(config.metadataSelectors)) {
          const val = getMetaContent(selector);
          if (val) metadata[key] = val;
        }
      }

      // 2. Clean Document Clone for Article Extraction
      const clone = document.body.cloneNode(true);
      
      // Default distraction selectors
      const defaultExcludes = [
        'nav', 'footer', 'aside', 'header',
        '.ad', '.ads', '.advertisement', '.ad-container', '.ad-slot',
        '[class*="sponsor"]', '[id*="sponsor"]', '[class*="ad-"]', '[id*="ad-"]',
        '.social-share', '.share-buttons', '.newsletter', '.subscribe',
        'style', 'script', 'noscript', 'iframe', 'svg', 'form',
        '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'
      ];
      
      const allExcludes = [...defaultExcludes, ...(config.excludeSelectors || [])];
      
      allExcludes.forEach(selector => {
        try {
          const elements = clone.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        } catch (e) {
          // Ignore invalid selectors
        }
      });

      // 3. Resilient Article Heuristic
      let bestEl = clone;
      let maxScore = -1;
      
      // Look for semantic article containers first
      const candidates = clone.querySelectorAll('article, main, [role="main"], .post-content, .article-content, .entry-content, div.content, div.article, section');
      const elementsToScore = candidates.length > 0 ? Array.from(candidates) : Array.from(clone.querySelectorAll('div, section, main'));
      
      elementsToScore.forEach(el => {
        const text = el.textContent || '';
        const textLen = text.trim().length;
        if (textLen < 100) return; // Skip too short containers
        
        const links = el.querySelectorAll('a');
        let linkTextLen = 0;
        links.forEach(a => linkTextLen += (a.textContent || '').length);
        
        const linkDensity = linkTextLen / (textLen || 1);
        
        // Paragraph count bonus
        const pCount = el.querySelectorAll('p').length;
        
        // Score: text length, penalize high link density, reward paragraphs
        const score = textLen - (textLen * linkDensity * 2) + (pCount * 50);
        
        // Ensure we don't just pick the body wrapper if a more specific container is better
        const bodyLen = clone.textContent.length;
        const sizeRatio = textLen / (bodyLen || 1);
        const finalScore = sizeRatio > 0.95 ? score * 0.8 : score; 
        
        if (finalScore > maxScore) {
          maxScore = finalScore;
          bestEl = el;
        }
      });
      
      // Clean up the extracted text (remove excessive whitespace)
      const rawText = bestEl.textContent || '';
      const cleanText = rawText.replace(/\n\s*\n/g, '\n\n').replace(/ +/g, ' ').trim();

      return { 
        type: 'article', 
        metadata: metadata,
        content: cleanText.substring(0, 20000) // Cap at 20k chars
      };
    }

    case 'SCREENSHOT': {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.dataUrl) {
            resolve({ type: 'image', content: response.dataUrl });
          } else {
            reject(new Error('Failed to capture screenshot.'));
          }
        });
      });
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
