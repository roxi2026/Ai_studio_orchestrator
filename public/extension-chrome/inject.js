// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // URL filtering for target AI Studio APIs to eliminate network intercept noise and CPU/memory overhead
  const RELEVANT_PATTERNS = ['generateContent', 'v1beta', 'executor', 'reviewer', 'prompts', 'StreamGenerateContent'];

  function isRelevantUrl(url) {
    if (!url) return false;
    const urlStr = typeof url === 'string' ? url : (url.url || url.href || String(url));
    return RELEVANT_PATTERNS.some(pattern => urlStr.includes(pattern));
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Determine which pane this WebSocket belongs to based on URL or request payload
    const pane = typeof url === 'string' && url.includes('executor') ? 'executor' : (typeof url === 'string' && url.includes('reviewer') ? 'reviewer' : 'unknown');
    
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
      const url = xhr.responseURL || '';
      // Performance optimization: skip non-AI Studio completion responses
      if (!isRelevantUrl(url)) return;

      // Determine which pane this XHR belongs to based on request URL
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
      
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
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Normalize target URL (safely handling Request, URL objects, and strings)
    const rawUrl = args[0] instanceof Request ? args[0].url : (args[0] && typeof args[0] === 'object' && args[0].href ? args[0].href : String(args[0] || ''));

    // Performance optimization: only clone and read body for relevant AI Studio endpoints
    if (isRelevantUrl(rawUrl)) {
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = rawUrl.includes('executor') ? 'executor' : (rawUrl.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(() => {});
    }
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected:', renderer);
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {},
    onCommitFiberUnmount: function() {}
  };

})();
