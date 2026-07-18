// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[Orchestrator] Main world script injected. Intercepting network requests...');

  // Helper to normalize any URL/Request to a string
  function getUrlString(input) {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return String(input);
  }

  // Helper to check if a URL belongs to target AI Studio APIs
  function isTargetApi(urlString) {
    return urlString.includes('generateContent') ||
           urlString.includes('v1beta') ||
           urlString.includes('executor') ||
           urlString.includes('reviewer');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    const urlString = getUrlString(url);
    
    if (isTargetApi(urlString)) {
      const pane = urlString.includes('executor') ? 'executor' : (urlString.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
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
    
    xhr.addEventListener('load', function() {
      const urlString = xhr.responseURL || '';

      // Perform fast URL-based network interception filtering to optimize host page performance
      if (!isTargetApi(urlString)) return;

      const pane = urlString.includes('executor') ? 'executor' : (urlString.includes('reviewer') ? 'reviewer' : 'unknown');
      
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
    
    // Perform fast, host-based network interception filtering
    // to avoid response body cloning/reading overhead for non-target assets/telemetry.
    if (!isTargetApi(urlString)) {
      return response;
    }
    
    try {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        const pane = urlString.includes('executor') ? 'executor' : (urlString.includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(() => {});
    } catch (e) {
      // Safely ignore cloning failures for non-clonable response types
    }
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  // Inject initialization script before main application bundle executes to capture commit events
  // This allows reading conversational context directly from memory pool
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[Orchestrator] React Fiber renderer injected:', renderer);
      // Hook into renderer commit events to read state object selectors
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
      // Read current conversational context directly from application's memory pool
      // Map state object selectors to identify variables controlling temperature limits, active model selection, etc.
    },
    onCommitFiberUnmount: function() {}
  };

})();
