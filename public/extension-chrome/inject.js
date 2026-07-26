// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    const urlString = url ? url.toString() : '';
    // Performance optimization: Filter out non-AI Studio API requests
    const isAIStudioApi = urlString.includes('generateContent') ||
                          urlString.includes('v1beta') ||
                          urlString.includes('executor') ||
                          urlString.includes('reviewer');

    if (isAIStudioApi) {
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
      requestUrl = url ? url.toString() : '';
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.addEventListener('load', function() {
      // Performance optimization: Filter out non-AI Studio API requests to prevent postMessage/clone/parsing overload
      const isAIStudioApi = requestUrl.includes('generateContent') ||
                            requestUrl.includes('v1beta') ||
                            requestUrl.includes('executor') ||
                            requestUrl.includes('reviewer');

      if (!isAIStudioApi) return;

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
    
    // Safely extract and normalize the URL input (which can be a String, URL, or Request object)
    let url = '';
    if (args[0]) {
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].href;
      } else if (args[0] instanceof Request) {
        url = args[0].url;
      } else {
        url = args[0].toString();
      }
    }
    
    // Performance optimization: Check if target URL contains relevant keywords before cloning or reading text
    const isAIStudioApi = url.includes('generateContent') ||
                          url.includes('v1beta') ||
                          url.includes('executor') ||
                          url.includes('reviewer');

    if (isAIStudioApi) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(err => {
        console.error('[CC] Error reading filtered fetch response:', err);
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
