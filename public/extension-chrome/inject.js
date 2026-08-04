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
      }, '*');
    });
    
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

    xhr.open = function(method, url, ...rest) {
      requestUrl = url instanceof URL ? url.href : String(url);
      return originalOpen.apply(this, [method, url, ...rest]);
    };
    
    xhr.addEventListener('load', function() {
      // Host-based filtering: target relevant AI Studio APIs before doing any heavy operations
      const isTarget = ['generateContent', 'v1beta', 'executor', 'reviewer'].some(api => requestUrl.includes(api));
      if (!isTarget) return;

      // Determine which pane this XHR belongs to based on request URL or payload
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
    if (!args[0]) return originalFetch.apply(this, args);

    // Safely handle URL objects, Request objects, and strings by normalizing the input to a string
    let urlStr = '';
    if (typeof args[0] === 'string') {
      urlStr = args[0];
    } else if (args[0] instanceof URL) {
      urlStr = args[0].href;
    } else if (args[0] instanceof Request) {
      urlStr = args[0].url;
    } else {
      urlStr = String(args[0]);
    }

    // Host-based filtering: only intercept relevant AI Studio APIs before cloning response body
    const isTarget = ['generateContent', 'v1beta', 'executor', 'reviewer'].some(api => urlStr.includes(api));
    if (!isTarget) {
      return originalFetch.apply(this, args);
    }

    const response = await originalFetch.apply(this, args);
    
    // Clone the response so we can read the body without consuming it for the original caller
    const clonedResponse = response.clone();
    
    clonedResponse.text().then(text => {
      // Determine which pane this fetch belongs to based on request URL or payload
      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');
      
      // Forward the intercepted response to the content script
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'FETCH_RESPONSE',
        pane: pane,
        payload: text
      }, '*');
    }).catch(err => {
      console.error('[CC] Error processing fetch response clone text:', err);
    });
    
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
