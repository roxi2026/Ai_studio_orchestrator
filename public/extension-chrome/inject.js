// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Normalize url safely
    const urlStr = url && typeof url === 'object' && 'href' in url ? url.href : String(url);
    
    // Host-based / URL selective filtering to optimize performance
    const matchesFilter = urlStr.includes('generateContent') ||
                          urlStr.includes('v1beta') ||
                          urlStr.includes('executor') ||
                          urlStr.includes('reviewer');

    if (matchesFilter) {
      // Determine which pane this WebSocket belongs to based on URL or request payload
      // This is a simplified heuristic. Real implementation would require deep inspection of the URL parameters.
      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

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
    
    xhr.addEventListener('load', function() {
      // Normalize response URL safely
      const urlStr = xhr.responseURL || '';
      
      // Host-based / URL selective filtering to optimize performance
      const matchesFilter = urlStr.includes('generateContent') ||
                            urlStr.includes('v1beta') ||
                            urlStr.includes('executor') ||
                            urlStr.includes('reviewer');

      if (matchesFilter) {
        // Determine which pane this XHR belongs to based on request URL or payload
        const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'XHR_RESPONSE',
          pane: pane,
          payload: xhr.responseText
        }, '*');
      }
    });
    
    return xhr;
  };
  
  // Copy prototype to ensure compatibility
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Normalize URL safely for URL objects, Request objects, and strings
    let urlStr = '';
    if (args[0] instanceof Request) {
      urlStr = args[0].url;
    } else if (args[0] && typeof args[0] === 'object' && 'href' in args[0]) {
      urlStr = args[0].href;
    } else {
      urlStr = String(args[0]);
    }

    // Host-based / URL selective filtering to avoid cloning and parsing non-AI Studio API payloads
    const matchesFilter = urlStr.includes('generateContent') ||
                          urlStr.includes('v1beta') ||
                          urlStr.includes('executor') ||
                          urlStr.includes('reviewer');
    
    if (matchesFilter) {
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
