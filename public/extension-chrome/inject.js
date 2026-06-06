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
    
    xhr.addEventListener('load', function() {
      // Determine which pane this XHR belongs to based on request URL or payload
      const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
      
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
  
  /**
   * Optimized fetch interception with URL filtering.
   * Only clones and parses responses from relevant AI Studio API endpoints to minimize overhead.
   */
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];

    // Only intercept relevant API calls (e.g., model generations)
    if (url.includes('generateContent') || url.includes('v1beta')) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(() => {/* Ignore clone errors */});
    }
    
    return response;
  };

  // --- Cleanup ---
  // Remove unused React DevTools hook simulation to reduce host page overhead.
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('[CC] Cleaning up legacy React DevTools hooks.');
    delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  }

})();
