// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Only intercept if URL is relevant to AI Studio generation
    if (url.includes('generateContent') || url.includes('v1beta')) {
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
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
  
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    let isTarget = false;

    xhr.open = function(method, url) {
      if (url.includes('generateContent') || url.includes('v1beta')) {
        isTarget = true;
      }
      return originalOpen.apply(this, arguments);
    };
    
    xhr.addEventListener('load', function() {
      if (isTarget) {
        const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
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
  
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];

    // Optimization: Only clone and parse if it's a target generation API call
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

})();
