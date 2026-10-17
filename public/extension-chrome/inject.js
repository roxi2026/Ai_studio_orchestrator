// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Target URL filter helper: avoid cloning responses and posting messages for static assets,
  // telemetry, fonts, or irrelevant requests to minimize CPU overhead and main thread blocking.
  function isTargetUrl(url) {
    if (!url) return false;
    const urlStr = typeof url === 'string' ? url : (url.url || String(url));
    return urlStr.includes('generateContent') ||
           urlStr.includes('v1beta') ||
           urlStr.includes('executor') ||
           urlStr.includes('reviewer') ||
           urlStr.includes('prompts');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Determine which pane this WebSocket belongs to based on URL or request payload
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
      const urlStr = xhr.responseURL || '';
      // Performance optimization: Filter by target API endpoints before posting messages
      if (isTargetUrl(urlStr)) {
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
    
    const requestTarget = args[0];
    const urlStr = requestTarget instanceof Request ? requestTarget.url : (typeof requestTarget === 'string' ? requestTarget : String(requestTarget || ''));
    
    // Performance optimization: Only clone and parse response bodies for relevant AI Studio API endpoints
    if (isTargetUrl(urlStr)) {
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
        // Silently ignore body parsing errors for closed streams
      });
    }
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected:', renderer);
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
    },
    onCommitFiberUnmount: function() {}
  };

})();
