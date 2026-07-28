// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Performance Interception Filter Helper
  // Avoids processing and cloning non-AI Studio API traffic (e.g., telemetry, assets, static pages)
  function isAIStudioAPITarget(urlString) {
    if (!urlString) return false;
    const urlLower = urlString.toLowerCase();
    // Only intercept paths related to model/execution APIs to conserve memory & CPU resources
    return urlLower.includes('generatecontent') ||
           urlLower.includes('v1beta') ||
           urlLower.includes('executor') ||
           urlLower.includes('reviewer');
  }

  // Helper to normalize input (handling strings, URL objects, and Request objects)
  function getUrlString(arg) {
    if (!arg) return '';
    if (typeof arg === 'string') return arg;
    if (arg instanceof URL) return arg.toString();
    if (typeof arg === 'object' && arg.url) return arg.url;
    return String(arg);
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    const urlString = getUrlString(url);
    
    // Filter optimization: Only add listeners if targeting AI Studio APIs
    if (isAIStudioAPITarget(urlString)) {
      const pane = urlString.includes('executor') ? 'executor' : (urlString.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
        // Forward the intercepted message to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'WS_MESSAGE',
          pane: pane,
          payload: event.data
        }, '*');
      });
    }
    
    return ws;
  };
  
  // Copy prototype to ensure compatibility
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    let requestUrl = '';

    xhr.open = function(method, url, ...args) {
      requestUrl = getUrlString(url);
      return originalOpen.call(this, method, url, ...args);
    };
    
    xhr.addEventListener('load', function() {
      // Filter optimization: Avoid parsing or posting response if it doesn't match AI Studio targets
      if (!isAIStudioAPITarget(requestUrl)) return;

      const pane = requestUrl.includes('executor') ? 'executor' : (requestUrl.includes('reviewer') ? 'reviewer' : 'unknown');
      
      // Forward the intercepted response to the content script
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'XHR_RESPONSE',
        pane: pane,
        payload: xhr.responseText
      }, '*');
    });
    
    return xhr;
  };
  
  // Copy prototype to ensure compatibility
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const urlString = getUrlString(args[0]);

    // Filter optimization: Skip cloning responses and reading text for irrelevant endpoints
    if (isAIStudioAPITarget(urlString)) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = urlString.includes('executor') ? 'executor' : (urlString.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(err => {
        console.warn('[CC] Failed to read response text:', err);
      });
    }
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  // Inject initialization script before main application bundle executes to capture commit events
  // This allows reading conversational context directly from memory pool
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected:', renderer);
      // Hook into renderer commit events to read state object selectors
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
      // Read current conversational context directly from application's memory pool
      // Map state object selectors to identify variables controlling temperature limits, active model selection, etc.
    },
    onCommitFiberUnmount: function() {}
  };

})();
