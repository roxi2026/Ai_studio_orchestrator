// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- Selective Interception Helper ---
  // Performance optimization: Only parse and forward AI Studio API-related requests
  function isUrlRelevant(url) {
    if (!url) return false;
    let urlStr = '';
    if (typeof url === 'string') {
      urlStr = url;
    } else if (url instanceof URL) {
      urlStr = url.toString();
    } else if (typeof url === 'object' && 'url' in url) {
      urlStr = url.url;
    }
    return urlStr.includes('generateContent') ||
           urlStr.includes('v1beta') ||
           urlStr.includes('executor') ||
           urlStr.includes('reviewer');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    const urlStr = url instanceof URL ? url.toString() : (url || '');
    if (isUrlRelevant(urlStr)) {
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
      const urlStr = xhr.responseURL || '';
      if (isUrlRelevant(urlStr)) {
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
    
    const url = args[0];
    if (isUrlRelevant(url)) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        // Determine which pane this fetch belongs to based on request URL or payload
        const urlStr = url instanceof Request ? url.url : (url instanceof URL ? url.toString() : url);
        const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(err => {
        console.warn('[CC] Failed to parse cloned response body:', err);
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
