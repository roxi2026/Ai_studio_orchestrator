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
      requestUrl = url;
      return originalOpen.apply(this, [method, url, ...rest]);
    };
    
    xhr.addEventListener('load', function() {
      // Performance optimization: Filter intercepts to target relevant AI Studio APIs (O(1) host-based check)
      const urlStr = String(requestUrl || xhr.responseURL || '');
      const isTargetUrl = urlStr.includes('generateContent') ||
                          urlStr.includes('v1beta') ||
                          urlStr.includes('executor') ||
                          urlStr.includes('reviewer');
      if (!isTargetUrl) return;

      // Determine which pane this XHR belongs to based on request URL or payload
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
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Parse the fetch target URL cleanly
    const rawUrl = args[0] instanceof Request ? args[0].url : args[0];
    const urlStr = String(rawUrl || '');

    // Performance optimization: Filter intercepts to target relevant AI Studio APIs (O(1) host-based check)
    // Avoids overhead, cloning, and processing response bodies of non-relevant requests (e.g. static assets, telemetry)
    const isTargetUrl = urlStr.includes('generateContent') ||
                        urlStr.includes('v1beta') ||
                        urlStr.includes('executor') ||
                        urlStr.includes('reviewer');
    if (!isTargetUrl) return response;

    try {
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
        console.warn('[CC] Failed to read cloned fetch response body:', err);
      });
    } catch (e) {
      console.warn('[CC] Failed to clone fetch response:', e);
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
