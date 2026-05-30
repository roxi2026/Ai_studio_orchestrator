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
      // Optimization: Only process relevant API responses to reduce overhead
      if (!xhr.responseURL.includes('generateContent') && !xhr.responseURL.includes('v1beta')) return;

      const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'XHR_RESPONSE',
        pane: pane,
        payload: xhr.responseText
      }, '*');
    });
    
    return xhr;
  };
  
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    // Optimization: Filter for AI Studio model output endpoints.
    // Avoids expensive cloning/parsing of images, scripts, and unrelated telemetry.
    if (url.includes('generateContent') || url.includes('v1beta')) {
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

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
  // Simplified: Only keep the hook presence to avoid breaking host page assumptions
  // but remove expensive commit-level processing until explicitly required.
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: (renderer) => console.log('[CC] React Fiber renderer detected.'),
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {}
  };

})();
