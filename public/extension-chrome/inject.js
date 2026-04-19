// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Determine which pane this WebSocket belongs to based on URL or request payload
    // This is a simplified heuristic. Real implementation would require deep inspection of the URL parameters.
    const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
    
    ws.addEventListener('message', function(event) {
      // Forward the intercepted message to the content script
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'WS_MESSAGE',
        pane: pane,
        payload: event.data
      }, window.location.origin); // Security: Restrict target origin
    });
    
    return ws;
  };
  
  // Copy prototype to ensure compatibility
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // Performance: Optimized filtering to ignore non-AI Studio traffic early
  const AI_STUDIO_PATTERNS = ['generateContent', 'v1beta/models', 'executor', 'reviewer'];
  function isAIStudioRequest(url) {
    const urlStr = url.toString();
    return AI_STUDIO_PATTERNS.some(pattern => urlStr.includes(pattern));
  }

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    xhr.addEventListener('load', function() {
      // Performance: Only process and broadcast relevant AI Studio responses
      if (!isAIStudioRequest(xhr.responseURL)) return;

      const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'XHR_RESPONSE',
        pane: pane,
        payload: xhr.responseText
      }, window.location.origin); // Security: Restrict target origin
    });
    
    return xhr;
  };
  
  // Copy prototype to ensure compatibility
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    const url = args[0] instanceof Request ? args[0].url : args[0];

    // Performance: Filter out irrelevant requests BEFORE cloning or reading text
    if (isAIStudioRequest(url)) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = url.toString().includes('executor') ? 'executor' : (url.toString().includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, window.location.origin); // Security: Restrict target origin
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
