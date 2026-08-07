// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[Orchestrator] Main world script injected. Intercepting network requests...');

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
  // PERFORMANCE OPTIMIZATION: Avoid intercepting and reading responses for non-target URLs
  // to prevent memory leaks, main-thread blocking, and unnecessary postMessage communications.
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    // Capture URL during open() call
    const originalOpen = xhr.open;
    let requestUrl = '';
    xhr.open = function(method, url, ...rest) {
      requestUrl = url ? (typeof url === 'string' ? url : (url.href || url.toString())) : '';
      return originalOpen.call(this, method, url, ...rest);
    };

    xhr.addEventListener('load', function() {
      const urlStr = xhr.responseURL || requestUrl || '';

      // Filter out non-target traffic (static assets, analytics, telemetry)
      const isTarget = urlStr.includes('generateContent') ||
                       urlStr.includes('v1beta') ||
                       urlStr.includes('executor') ||
                       urlStr.includes('reviewer');
      if (!isTarget) return;

      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');
      
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
  // PERFORMANCE OPTIMIZATION: Check URL compatibility and filter out non-target URLs
  // BEFORE cloning or calling response.text() to eliminate memory bloat and garbage collection thrashing.
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    // 1. Safely extract and normalize the request URL to a string
    let urlStr = '';
    const firstArg = args[0];
    if (typeof firstArg === 'string') {
      urlStr = firstArg;
    } else if (firstArg instanceof URL) {
      urlStr = firstArg.href;
    } else if (firstArg instanceof Request) {
      urlStr = firstArg.url;
    } else if (firstArg && typeof firstArg.toString === 'function') {
      urlStr = firstArg.toString();
    }

    // 2. Perform early-exit filtering for target AI Studio APIs
    const isTarget = urlStr.includes('generateContent') ||
                     urlStr.includes('v1beta') ||
                     urlStr.includes('executor') ||
                     urlStr.includes('reviewer');

    // Bypass interception completely for non-target calls
    if (!isTarget) {
      return originalFetch.apply(this, args);
    }

    // Otherwise, fetch and process the payload
    const response = await originalFetch.apply(this, args);
    
    // Clone the response so we can read the body without consuming it for the original caller
    const clonedResponse = response.clone();
    
    clonedResponse.text().then(text => {
      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');
      
      // Forward the intercepted response to the content script
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'FETCH_RESPONSE',
        pane: pane,
        payload: text
      }, '*');
    }).catch(err => {
      console.warn('[Orchestrator] Error reading intercepted fetch body:', err);
    });
    
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
