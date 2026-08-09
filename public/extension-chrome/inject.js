// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Helper to normalize any input (URL, Request object, string) to string and filter
  // This targets only relevant AI Studio APIs, saving CPU cycles and memory allocations.
  function isTargetApi(urlInput) {
    if (!urlInput) return false;
    let urlStr = '';
    if (typeof urlInput === 'string') {
      urlStr = urlInput;
    } else if (urlInput instanceof URL) {
      urlStr = urlInput.toString();
    } else if (typeof urlInput === 'object' && urlInput.url) {
      urlStr = urlInput.url;
    } else {
      try {
        urlStr = String(urlInput);
      } catch (e) {
        return false;
      }
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
    
    // Determine which pane this WebSocket belongs to based on URL or request payload
    // This is a simplified heuristic. Real implementation would require deep inspection of the URL parameters.
    const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
    
    ws.addEventListener('message', function(event) {
      // Only process and forward relevant websocket traffic
      if (isTargetApi(url)) {
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'WS_MESSAGE',
          pane: pane,
          payload: event.data
        }, '*');
      }
    });
    
    return ws;
  };
  
  // Copy prototype to ensure compatibility
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    xhr.addEventListener('load', function() {
      const url = xhr.responseURL;
      // Filter out non-relevant request responses to optimize CPU and memory usage
      if (isTargetApi(url)) {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

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
    
    // Check if the URL is target AI Studio API before cloning to prevent high memory overhead
    if (isTargetApi(url)) {
      try {
        // Clone the response so we can read the body without consuming it for the original caller
        const clonedResponse = response.clone();

        clonedResponse.text().then(text => {
          const urlStr = url instanceof Request ? url.url : String(url);
          const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

          // Forward the intercepted response to the content script
          window.postMessage({
            source: 'ORCHESTRATOR_INJECT',
            type: 'FETCH_RESPONSE',
            pane: pane,
            payload: text
          }, '*');
        }).catch(err => {
          console.error('[CC] Error reading fetch body:', err);
        });
      } catch (err) {
        console.error('[CC] Error cloning fetch response:', err);
      }
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
